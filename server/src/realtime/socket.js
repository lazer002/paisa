// server/src/realtime/socket.js
//
// socket.io server attached to the API's http server (path /socket.io).
//
// Security model
// - Handshake: the client sends its in-memory access token as
//   `auth: { token }`. It is verified with the same JWT util and the same
//   user / organization / password-change checks as middleware/authenticate.js.
//   A failed handshake is refused with `connect_error` (err.data.code).
// - Rooms are chosen by the server only: `user:<userId>` and, for
//   non-super_admin users, `org:<instituteId>`. Conversation rooms
//   `conv:<conversationPublicId>` are joined on request after a participant
//   check against the database.
// - When the access token expires the server emits `auth_error` and
//   disconnects; the client refreshes over REST and reconnects.
//
// Events pushed to clients are produced through ./emitter.js.

import { Server } from "socket.io";

import { verifyAccessToken } from "../utils/jwt.js";
import { get } from "../utils/redis.js";
import { corsOptions } from "../middleware/security.js";
import { ROLES } from "../config/constants.js";
import logger from "../config/logger.js";

import { User } from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";
import Organization from "../models/organization.js";
import { Conversation } from "../models/Conversation.js";

import {
  setRealtimeServer,
  userRoom,
  orgRoom,
  conversationRoom,
} from "./emitter.js";

const TYPING_MIN_INTERVAL_MS = 1500;
const EVENT_WINDOW_MS = 10_000;
const EVENT_WINDOW_MAX = 40;
const MAX_TIMER_MS = 2_147_000_000;

class SocketAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.data = { code };
  }
}

/*
|--------------------------------------------------------------------------
| Access token → user (mirrors middleware/authenticate.js)
|--------------------------------------------------------------------------
*/

export const resolveSocketUser = async (token) => {
  if (!token || typeof token !== "string") {
    throw new SocketAuthError(
      "Authentication required",
      "AUTHENTICATION_REQUIRED"
    );
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      throw new SocketAuthError(
        "Access token has expired",
        "ACCESS_TOKEN_EXPIRED"
      );
    }

    throw new SocketAuthError(
      "Invalid access token",
      "INVALID_ACCESS_TOKEN"
    );
  }

  if (!payload?.sub) {
    throw new SocketAuthError(
      "Invalid authentication token",
      "INVALID_ACCESS_TOKEN"
    );
  }

  if (payload.type && payload.type !== "access") {
    throw new SocketAuthError(
      "Invalid token type",
      "INVALID_TOKEN_TYPE"
    );
  }

  if (payload.jti) {
    const revoked = await get(
      `paisa:auth:revoked:${payload.jti}`
    );

    if (revoked) {
      throw new SocketAuthError(
        "Authentication session has been revoked",
        "TOKEN_REVOKED"
      );
    }
  }

  // Same rule as authenticate.js: a signed-out session cannot reconnect.
  if (
    payload.sid &&
    !(await RefreshSession.exists({
      _id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
    }))
  ) {
    throw new SocketAuthError(
      "Authentication session has been revoked",
      "TOKEN_REVOKED"
    );
  }

  const user = await User.findById(payload.sub)
    .select(
      "_id publicId name role status instituteId " +
        "isDeleted deletedAt passwordChangedAt"
    )
    .lean();

  if (!user) {
    throw new SocketAuthError(
      "User account not found",
      "USER_NOT_FOUND"
    );
  }

  if (user.isDeleted || user.deletedAt) {
    throw new SocketAuthError(
      "User account has been deleted",
      "ACCOUNT_DELETED"
    );
  }

  if (
    String(user.status || "active").toLowerCase() !==
    "active"
  ) {
    throw new SocketAuthError(
      "User account is not active",
      "ACCOUNT_INACTIVE"
    );
  }

  if (user.role !== ROLES.SUPER_ADMIN) {
    if (!user.instituteId) {
      throw new SocketAuthError(
        "User organization not found",
        "ORGANIZATION_NOT_FOUND"
      );
    }

    const organization = await Organization.findOne({
      _id: user.instituteId,
      isDeleted: false,
    })
      .select("_id status")
      .lean();

    if (!organization) {
      throw new SocketAuthError(
        "User organization not found",
        "ORGANIZATION_NOT_FOUND"
      );
    }

    if (organization.status !== "active") {
      throw new SocketAuthError(
        "User organization is not active",
        "ORGANIZATION_INACTIVE"
      );
    }
  }

  if (payload.iat && user.passwordChangedAt) {
    const changedAt =
      new Date(user.passwordChangedAt).getTime() / 1000;

    if (changedAt > Number(payload.iat)) {
      throw new SocketAuthError(
        "Authentication token is no longer valid",
        "TOKEN_INVALIDATED"
      );
    }
  }

  return { user, payload };
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// Simple fixed-window limiter per socket for all client → server events.
const allowEvent = (socket) => {
  const now = Date.now();
  const bucket = socket.data.rate;

  if (now - bucket.start > EVENT_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }

  bucket.count += 1;

  return bucket.count <= EVENT_WINDOW_MAX;
};

const reply = (ack, body) => {
  if (typeof ack === "function") {
    ack(body);
  }
};

const conversationIdFrom = (data) => {
  const raw =
    typeof data === "string" ? data : data?.conversationId;

  if (typeof raw !== "string") return null;

  const value = raw.trim();

  // publicIds are short url-safe strings; reject anything else outright.
  return /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : null;
};

const loadParticipantConversation = async (
  socket,
  conversationId
) => {
  const { id, role, instituteId } = socket.data.user;

  const query = {
    publicId: conversationId,
    isDeleted: false,
    participants: {
      $elemMatch: { userId: id, status: "active" },
    },
  };

  if (role !== ROLES.SUPER_ADMIN) {
    query.instituteId = instituteId;
  }

  return Conversation.findOne(query).select("_id publicId").lean();
};

/*
|--------------------------------------------------------------------------
| Init
|--------------------------------------------------------------------------
*/

let io = null;

export const initRealtime = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: corsOptions.origin,
      credentials: true,
    },
    // Clients only send small control events (join, typing).
    maxHttpBufferSize: 16 * 1024,
    serveClient: false,
  });

  io.use(async (socket, next) => {
    try {
      const { user, payload } = await resolveSocketUser(
        socket.handshake.auth?.token
      );

      socket.data.user = {
        id: String(user._id),
        publicId: user.publicId || null,
        name: user.name || "Someone",
        role: user.role,
        instituteId: user.instituteId
          ? String(user.instituteId)
          : null,
      };

      socket.data.tokenExp = payload.exp
        ? Number(payload.exp) * 1000
        : null;

      socket.data.rate = { start: Date.now(), count: 0 };
      socket.data.typingAt = new Map();

      return next();
    } catch (error) {
      if (error instanceof SocketAuthError) {
        return next(error);
      }

      logger.error("Socket authentication failed", {
        error: { message: error?.message },
      });

      const failure = new Error("Authentication failed");
      failure.data = { code: "AUTHENTICATION_FAILED" };

      return next(failure);
    }
  });

  io.on("connection", (socket) => {
    const me = socket.data.user;

    socket.join(userRoom(me.id));

    if (me.role !== ROLES.SUPER_ADMIN && me.instituteId) {
      socket.join(orgRoom(me.instituteId));
    }

    // Kick the socket when its access token expires; the client refreshes
    // and reconnects with a new token.
    let expiryTimer = null;

    if (socket.data.tokenExp) {
      const delay = Math.min(
        Math.max(socket.data.tokenExp - Date.now(), 0),
        MAX_TIMER_MS
      );

      expiryTimer = setTimeout(() => {
        socket.emit("auth_error", {
          code: "ACCESS_TOKEN_EXPIRED",
          message: "Access token has expired",
        });
        socket.disconnect(true);
      }, delay);

      expiryTimer.unref?.();
    }

    socket.on("conversation:join", async (data, ack) => {
      if (!allowEvent(socket)) {
        return reply(ack, { ok: false, code: "RATE_LIMITED" });
      }

      const conversationId = conversationIdFrom(data);

      if (!conversationId) {
        return reply(ack, { ok: false, code: "VALIDATION_ERROR" });
      }

      try {
        const conversation = await loadParticipantConversation(
          socket,
          conversationId
        );

        if (!conversation) {
          return reply(ack, { ok: false, code: "ACCESS_DENIED" });
        }

        socket.join(conversationRoom(conversation.publicId));

        return reply(ack, { ok: true });
      } catch (error) {
        logger.warn("conversation:join failed", {
          error: { message: error?.message },
        });

        return reply(ack, { ok: false, code: "SERVER_ERROR" });
      }
    });

    socket.on("conversation:leave", (data, ack) => {
      const conversationId = conversationIdFrom(data);

      if (conversationId) {
        socket.leave(conversationRoom(conversationId));
        socket.data.typingAt.delete(conversationId);
      }

      return reply(ack, { ok: Boolean(conversationId) });
    });

    // Typing indicator: relayed only into rooms this socket has joined
    // (joined = participant check passed), throttled per conversation.
    socket.on("typing", (data) => {
      if (!allowEvent(socket)) return;

      const conversationId = conversationIdFrom(data);

      if (!conversationId) return;

      const room = conversationRoom(conversationId);

      if (!socket.rooms.has(room)) return;

      const isTyping = data?.isTyping !== false;
      const now = Date.now();

      if (isTyping) {
        const last = socket.data.typingAt.get(conversationId) || 0;

        if (now - last < TYPING_MIN_INTERVAL_MS) return;

        socket.data.typingAt.set(conversationId, now);
      } else {
        socket.data.typingAt.delete(conversationId);
      }

      socket.to(room).emit("typing", {
        conversationId,
        userId: me.publicId || me.id,
        name: me.name,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      if (expiryTimer) clearTimeout(expiryTimer);
    });
  });

  setRealtimeServer(io);

  logger.info("Realtime (socket.io) ready", {
    path: "/socket.io",
  });

  return io;
};

// Drops every socket so the http server can finish closing. The http server
// itself is closed by server.js (io.close() would close it a second time).
export const closeRealtime = () => {
  if (!io) return;

  const server = io;

  io = null;
  setRealtimeServer(null);

  try {
    server.disconnectSockets(true);
  } catch {
    /* already closed */
  }
};

export default initRealtime;
