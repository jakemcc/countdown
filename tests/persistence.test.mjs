import assert from "node:assert/strict";
import test from "node:test";

import { createPersistenceManager } from "../persistence.mjs";

test("requestPersistenceOnce skips persist when already persisted", async () => {
  let persistCalls = 0;
  const manager = createPersistenceManager({
    storage: {
      persisted: async () => true,
      persist: async () => {
        persistCalls += 1;
        return true;
      },
    },
  });

  await manager.checkPersisted();
  await manager.requestPersistenceOnce();

  assert.equal(persistCalls, 0);
});

test("requestPersistenceOnce only calls persist once", async () => {
  let persistCalls = 0;
  const manager = createPersistenceManager({
    storage: {
      persisted: async () => false,
      persist: async () => {
        persistCalls += 1;
        return true;
      },
    },
  });

  await manager.checkPersisted();
  await manager.requestPersistenceOnce();
  await manager.requestPersistenceOnce();

  assert.equal(persistCalls, 1);
});

test("requestPersistenceOnce notifies when persist is denied", async () => {
  let deniedCalls = 0;
  const manager = createPersistenceManager({
    storage: {
      persisted: async () => false,
      persist: async () => false,
    },
    onDenied: () => {
      deniedCalls += 1;
    },
  });

  await manager.checkPersisted();
  const result = await manager.requestPersistenceOnce();

  assert.equal(result, false);
  assert.equal(deniedCalls, 1);
});

test("requestPersistenceOnce is quiet without persist support", async () => {
  let deniedCalls = 0;
  const manager = createPersistenceManager({
    storage: {
      persisted: async () => false,
    },
    onDenied: () => {
      deniedCalls += 1;
    },
  });

  await manager.checkPersisted();
  const result = await manager.requestPersistenceOnce();

  assert.equal(result, false);
  assert.equal(deniedCalls, 0);
});
