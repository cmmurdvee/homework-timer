export const MAX_DURATION_SECONDS = 24 * 60 * 60;

export class TimerError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "TimerError";
    this.status = status;
  }
}

export function remainingSeconds(timer, now = Date.now()) {
  if (timer.status === "paused") {
    return timer.remainingSeconds;
  }

  return Math.max(0, Math.ceil((Date.parse(timer.endsAt) - now) / 1000));
}

export function settleExpiredTimer(state, now = Date.now()) {
  if (
    !state.activeTimer ||
    state.activeTimer.status !== "running" ||
    remainingSeconds(state.activeTimer, now) > 0
  ) {
    return;
  }

  const timer = state.activeTimer;
  state.completedTasks.unshift({
    id: timer.id,
    title: timer.title,
    durationSeconds: timer.durationSeconds,
    startedAt: timer.startedAt,
    completedAt: timer.endsAt,
    completionReason: "timer",
  });
  state.activeTimer = null;
}

export function createTimer(state, input, now = Date.now()) {
  settleExpiredTimer(state, now);

  if (state.activeTimer) {
    throw new TimerError("A timer is already active.", 409);
  }

  const title = typeof input?.title === "string" ? input.title.trim() : "";
  if (!title || title.length > 160) {
    throw new TimerError("Title must be between 1 and 160 characters.");
  }

  const durationSeconds = input?.durationSeconds;
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 1 ||
    durationSeconds > MAX_DURATION_SECONDS
  ) {
    throw new TimerError(
      `durationSeconds must be an integer from 1 to ${MAX_DURATION_SECONDS}.`,
    );
  }

  const startedAt = new Date(now).toISOString();
  state.activeTimer = {
    id: crypto.randomUUID(),
    title,
    durationSeconds,
    remainingSeconds: durationSeconds,
    status: "running",
    startedAt,
    endsAt: new Date(now + durationSeconds * 1000).toISOString(),
  };

  return state.activeTimer;
}

export function updateTimer(state, action, now = Date.now()) {
  settleExpiredTimer(state, now);

  const timer = state.activeTimer;
  if (!timer) {
    throw new TimerError("There is no active timer.", 404);
  }

  if (action === "pause") {
    if (timer.status === "paused") {
      throw new TimerError("The timer is already paused.", 409);
    }

    timer.remainingSeconds = remainingSeconds(timer, now);
    timer.status = "paused";
    timer.endsAt = null;
  } else if (action === "resume") {
    if (timer.status !== "paused") {
      throw new TimerError("The timer is not paused.", 409);
    }

    timer.status = "running";
    timer.endsAt = new Date(
      now + timer.remainingSeconds * 1000,
    ).toISOString();
  } else if (action === "complete") {
    state.completedTasks.unshift({
      id: timer.id,
      title: timer.title,
      durationSeconds: timer.durationSeconds,
      startedAt: timer.startedAt,
      completedAt: new Date(now).toISOString(),
      completionReason: "manual",
    });
    state.activeTimer = null;
    return null;
  } else {
    throw new TimerError(
      'action must be one of "pause", "resume", or "complete".',
    );
  }

  return timer;
}

export function cancelTimer(state, now = Date.now()) {
  settleExpiredTimer(state, now);

  if (!state.activeTimer) {
    throw new TimerError("There is no active timer.", 404);
  }

  state.activeTimer = null;
}
