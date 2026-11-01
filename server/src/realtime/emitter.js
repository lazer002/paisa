// server/src/realtime/emitter.js
//
// Tiny push helper used by controllers/services. It holds the socket.io
// server once `initRealtime()` (socket.js) has attached it; until then every
// call is a no-op, so unit tests, seed scripts and e2e tools that import
// controllers never need a socket server.
//
// REST stays the source of truth: these events only tell clients that
// something changed (and carry the changed record for instant display).

let io = null;

export const setRealtimeServer = (server) => {
  io = server || null;
};

export const getRealtimeServer = () => io;

export const isRealtimeReady = () => io !== null;

export const userRoom = (userId) => `user:${String(userId)}`;

export const orgRoom = (instituteId) => `org:${String(instituteId)}`;

export const conversationRoom = (conversationId) =>
  `conv:${String(conversationId)}`;

// Never let a push failure break the request that triggered it.
const safely = (fn) => {
  if (!io) {
    return;
  }

  try {
    fn(io);
  } catch {
    /* realtime is best effort */
  }
};

export const emit = {
  toUser(userId, event, payload) {
    if (!userId) return;

    safely((server) =>
      server.to(userRoom(userId)).emit(event, payload)
    );
  },

  toUsers(userIds, event, payload) {
    const rooms = [
      ...new Set(
        (userIds || [])
          .filter(Boolean)
          .map((id) => userRoom(id))
      ),
    ];

    if (rooms.length === 0) return;

    safely((server) => server.to(rooms).emit(event, payload));
  },

  toOrg(instituteId, event, payload) {
    if (!instituteId) return;

    safely((server) =>
      server.to(orgRoom(instituteId)).emit(event, payload)
    );
  },

  toConversation(conversationId, event, payload) {
    if (!conversationId) return;

    safely((server) =>
      server
        .to(conversationRoom(conversationId))
        .emit(event, payload)
    );
  },

  // Signs out every open socket of a user (sessions revoked). The client
  // treats auth_error as "refresh"; the revoked refresh fails and it logs out.
  disconnectUser(userId, code = "SESSION_REVOKED") {
    if (!userId) return;

    safely((server) => {
      server.in(userRoom(userId)).emit("auth_error", { code });
      server.in(userRoom(userId)).disconnectSockets(true);
    });
  },

  // Removes every socket of a user from a conversation room (after they
  // leave the conversation), so they stop receiving its pushes at once.
  removeUserFromConversation(userId, conversationId) {
    if (!userId || !conversationId) return;

    safely((server) =>
      server
        .in(userRoom(userId))
        .socketsLeave(conversationRoom(conversationId))
    );
  },
};

export default emit;
