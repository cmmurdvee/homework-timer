import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cancelTimer,
  createTimer,
  remainingSeconds,
  settleExpiredTimer,
  TimerError,
  updateTimer,
} from "./timer.js";

function createState() {
  return { activeTimer: null, completedTasks: [] };
}

test("creates a timer and prevents a second active timer", () => {
  const state = createState();
  const now = Date.parse("2026-01-01T00:00:00.000Z");
  const timer = createTimer(
    state,
    { title: "  Math homework  ", durationSeconds: 60 },
    now,
  );

  assert.equal(timer.title, "Math homework");
  assert.equal(timer.status, "running");
  assert.equal(timer.remainingSeconds, 60);
  assert.equal(timer.endsAt, "2026-01-01T00:01:00.000Z");
  assert.throws(
    () => createTimer(state, { title: "Another task", durationSeconds: 30 }, now),
    { name: "TimerError", status: 409 },
  );
});

test("rejects invalid timer details", () => {
  const state = createState();

  for (const input of [
    { title: "", durationSeconds: 10 },
    { title: "Too short", durationSeconds: 0 },
    { title: "Fractional", durationSeconds: 1.5 },
    { title: "Too long", durationSeconds: 86401 },
  ]) {
    assert.throws(() => createTimer(state, input), TimerError);
  }
});

test("pause and resume preserve remaining time", () => {
  const state = createState();
  const startedAt = Date.parse("2026-01-01T00:00:00.000Z");
  createTimer(state, { title: "Science", durationSeconds: 60 }, startedAt);

  const paused = updateTimer(state, "pause", startedAt + 15_200);
  assert.equal(paused.status, "paused");
  assert.equal(paused.remainingSeconds, 45);
  assert.equal(paused.endsAt, null);
  assert.equal(remainingSeconds(paused, startedAt + 50_000), 45);

  const resumed = updateTimer(state, "resume", startedAt + 50_000);
  assert.equal(resumed.status, "running");
  assert.equal(resumed.endsAt, "2026-01-01T00:01:35.000Z");
});

test("manual completion adds a completed task", () => {
  const state = createState();
  const now = Date.parse("2026-01-01T00:00:00.000Z");
  const timer = createTimer(
    state,
    { title: "History", durationSeconds: 60 },
    now,
  );

  assert.equal(updateTimer(state, "complete", now + 10_000), null);
  assert.equal(state.activeTimer, null);
  assert.deepEqual(state.completedTasks[0], {
    id: timer.id,
    title: "History",
    durationSeconds: 60,
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:10.000Z",
    completionReason: "manual",
  });
});

test("an expired timer is added to completed tasks", () => {
  const state = createState();
  const now = Date.parse("2026-01-01T00:00:00.000Z");
  const timer = createTimer(
    state,
    { title: "English", durationSeconds: 1 },
    now,
  );

  settleExpiredTimer(state, now + 1_000);

  assert.equal(state.activeTimer, null);
  assert.equal(state.completedTasks[0].id, timer.id);
  assert.equal(state.completedTasks[0].completionReason, "timer");
  assert.equal(state.completedTasks[0].completedAt, timer.endsAt);
});

test("cancelling does not create a completed task", () => {
  const state = createState();
  createTimer(state, { title: "Cancelled", durationSeconds: 60 });

  cancelTimer(state);

  assert.equal(state.activeTimer, null);
  assert.deepEqual(state.completedTasks, []);
});
