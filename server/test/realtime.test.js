import test from "node:test";
import assert from "node:assert/strict";

import {
  emit,
  setRealtimeServer,
  isRealtimeReady,
} from "../src/realtime/emitter.js";

// Records what the emitter asks socket.io to do.
const fakeServer = () => {
  const calls = [];

  const target = (rooms) => ({
    emit: (event, payload) =>
      calls.push({ rooms, event, payload }),
    socketsLeave: (room) =>
      calls.push({ rooms, leave: room }),
  });

  return {
    calls,
    to: target,
    in: target,
  };
};

test("emit is a no-op before sockets are initialised", () => {
  setRealtimeServer(null);

  assert.equal(isRealtimeReady(), false);
  assert.doesNotThrow(() => {
    emit.toUser("u1", "notification:new", {});
    emit.toUsers(["u1", "u2"], "conversation:updated", {});
    emit.toOrg("o1", "x", {});
    emit.toConversation("conv_1", "message:new", {});
    emit.removeUserFromConversation("u1", "conv_1");
  });
});

test("emit targets server-named rooms only", () => {
  const server = fakeServer();
  setRealtimeServer(server);

  emit.toUser("u1", "notification:new", { a: 1 });
  emit.toOrg("o1", "org:event", {});
  emit.toConversation("conv_1", "message:new", {});
  emit.toUsers(["u1", "u1", null, "u2"], "conversation:updated", {});
  emit.removeUserFromConversation("u1", "conv_1");

  assert.deepEqual(
    server.calls.map((call) => call.rooms),
    [
      "user:u1",
      "org:o1",
      "conv:conv_1",
      ["user:u1", "user:u2"],
      "user:u1",
    ]
  );
  assert.equal(server.calls.at(-1).leave, "conv:conv_1");

  setRealtimeServer(null);
});

test("emit skips empty targets and swallows socket errors", () => {
  const server = fakeServer();
  setRealtimeServer(server);

  emit.toUser(null, "x", {});
  emit.toUsers([], "x", {});
  emit.toConversation("", "x", {});
  assert.equal(server.calls.length, 0);

  setRealtimeServer({
    to: () => {
      throw new Error("boom");
    },
  });
  assert.doesNotThrow(() => emit.toUser("u1", "x", {}));

  setRealtimeServer(null);
});
