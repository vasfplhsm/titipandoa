import { test } from "node:test";
import assert from "node:assert/strict";
import { advance, initial, restore, save, MAX } from "./model.js";
test("guided transitions count once and retain completed stages", () => {
  let g = {
    index: 0,
    stages: [
      { id: "subhanallah", count: 0, target: 33 },
      { id: "alhamdulillah", count: 0, target: 33 },
    ],
  };
  for (let i = 0; i < 33; i++) g = advance(g);
  assert.deepEqual(
    g.stages.map((s) => s.count),
    [33, 0],
  );
  g = advance(g);
  assert.deepEqual(
    g.stages.map((s) => s.count),
    [33, 1],
  );
  assert.equal(g.index, 1);
  for (let i = 0; i < 40; i++) g = advance(g);
  assert.equal(g.stages[1].count, 41);
});
test("large counts saturate safely", () => {
  const g = advance({
    index: 0,
    stages: [{ id: "subhanallah", count: MAX, target: 33 }],
  });
  assert.equal(g.stages[0].count, MAX);
});
test("progress, preferences and guided state survive serialization", () => {
  const s = initial();
  s.sessions.subhanallah = {
    count: 108,
    target: 99,
    elapsed: 5000,
    started: 123,
  };
  s.settings.sound = true;
  s.guided = {
    index: 1,
    stages: [
      { id: "subhanallah", count: 33, target: 33 },
      { id: "alhamdulillah", count: 4, target: 99 },
    ],
    started: 123,
    elapsed: 4000,
  };
  assert.deepEqual(restore(JSON.parse(JSON.stringify(s))), s);
});
test("malformed saved data is sanitized", () => {
  const s = restore({
    version: 1,
    selected: "missing",
    sessions: { subhanallah: { count: -5, target: 0 } },
    guided: { stages: [{ id: "missing" }] },
    custom: [null].filter(Boolean),
  });
  assert.equal(s.selected, "subhanallah");
  assert.equal(s.sessions.subhanallah.count, 0);
  assert.equal(s.sessions.subhanallah.target, 33);
  assert.equal(s.guided, null);
});
test("full or unavailable storage reports failure", () => {
  assert.equal(
    save(
      {
        setItem() {
          throw new Error("QuotaExceededError");
        },
      },
      initial(),
    ),
    false,
  );
  let raw;
  assert.equal(
    save(
      {
        setItem(k, v) {
          raw = v;
        },
      },
      initial(),
    ),
    true,
  );
  assert.deepEqual(restore(JSON.parse(raw)), initial());
});
