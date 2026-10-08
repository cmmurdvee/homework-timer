import { TimerError } from "@/lib/timer";
import { getSupabaseClient } from "@/lib/supabase";

const stateKey = Symbol.for("homework-timer.state-queue");
const maxWriteAttempts = 5;

function columnName(environmentVariable, defaultName) {
  const value = process.env[environmentVariable]?.trim() || defaultName;
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
    throw new Error(
      `${environmentVariable} must be a valid unqualified database identifier.`,
    );
  }
  return value;
}

function getStoreConfig() {
  const stateId = process.env.SUPABASE_STATE_ID?.trim() || "global";
  if (!stateId) {
    throw new Error("SUPABASE_STATE_ID must not be empty.");
  }

  return {
    table: columnName("SUPABASE_TIMER_TABLE", "timer_app_state"),
    idColumn: columnName("SUPABASE_ID_COLUMN", "id"),
    activeTimerColumn: columnName(
      "SUPABASE_ACTIVE_TIMER_COLUMN",
      "active_timer",
    ),
    completedTasksColumn: columnName(
      "SUPABASE_COMPLETED_TASKS_COLUMN",
      "completed_tasks",
    ),
    revisionColumn: columnName("SUPABASE_REVISION_COLUMN", "revision"),
    stateId,
  };
}

function validateStateRow(row, config) {
  const activeTimer = row[config.activeTimerColumn];
  const completedTasks = row[config.completedTasksColumn];
  const revision = row[config.revisionColumn];

  if (
    (activeTimer !== null &&
      (typeof activeTimer !== "object" || Array.isArray(activeTimer))) ||
    !Array.isArray(completedTasks) ||
    !Number.isSafeInteger(Number(revision)) ||
    Number(revision) < 0
  ) {
    throw new Error("Supabase timer state row has an invalid format.");
  }

  return {
    activeTimer,
    completedTasks,
    revision: Number(revision),
  };
}

async function ensureStateRow(client, config) {
  const { error } = await client
    .from(config.table)
    .upsert(
      {
        [config.idColumn]: config.stateId,
        [config.activeTimerColumn]: null,
        [config.completedTasksColumn]: [],
        [config.revisionColumn]: 0,
      },
      { onConflict: config.idColumn, ignoreDuplicates: true },
    );

  if (error) {
    throw error;
  }
}

async function readState(client, config) {
  const columns = [
    config.activeTimerColumn,
    config.completedTasksColumn,
    config.revisionColumn,
  ].join(",");
  const { data, error } = await client
    .from(config.table)
    .select(columns)
    .eq(config.idColumn, config.stateId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return validateStateRow(data, config);
}

async function runOperation(operation) {
  const config = getStoreConfig();
  const client = getSupabaseClient();
  await ensureStateRow(client, config);

  for (let attempt = 0; attempt < maxWriteAttempts; attempt += 1) {
    const storedState = await readState(client, config);
    if (!storedState) {
      continue;
    }

    const state = {
      activeTimer: storedState.activeTimer,
      completedTasks: storedState.completedTasks,
    };
    const originalState = JSON.stringify(state);
    const result = await operation(state);

    if (JSON.stringify(state) === originalState) {
      return result;
    }

    const { data, error } = await client
      .from(config.table)
      .update({
        [config.activeTimerColumn]: state.activeTimer,
        [config.completedTasksColumn]: state.completedTasks,
        [config.revisionColumn]: storedState.revision + 1,
      })
      .eq(config.idColumn, config.stateId)
      .eq(config.revisionColumn, storedState.revision)
      .select(config.revisionColumn)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (data) {
      return result;
    }
  }

  throw new TimerError(
    "Timer state changed too frequently. Please retry the request.",
    503,
  );
}

export function withTimerState(operation) {
  const previous = globalThis[stateKey] ?? Promise.resolve();
  const current = previous.then(() => runOperation(operation));

  globalThis[stateKey] = current.catch(() => {});
  return current;
}
