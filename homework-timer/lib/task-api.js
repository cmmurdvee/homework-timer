import { jsonResponse, parseJsonRequest } from "@/lib/api-response";
import { getSupabaseClient, getTaskTableName } from "@/lib/supabase";
import { TimerError } from "@/lib/timer";

function logDatabaseError(action, error) {
  console.error(`Supabase ${action} task error:`, error);
  return jsonResponse({ error: "Database request failed" }, 500);
}

function logApiError(action, error) {
  if (error instanceof TimerError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  console.error(`${action} task API failed:`, error);
  return jsonResponse({ error: "Internal Server Error" }, 500);
}

function taskId(input) {
  if (typeof input?.id !== "string" || input.id.trim().length === 0) {
    return null;
  }
  return input.id.trim();
}

export async function createTask(request) {
  try {
    const input = await parseJsonRequest(request);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return jsonResponse({ error: "A task object is required" }, 400);
    }
    const title = typeof input?.title === "string" ? input.title.trim() : "";
    if (!title) {
      return jsonResponse({ error: "Title is required" }, 400);
    }
    if (title.length > 100) {
      return jsonResponse({ error: "Title must be at most 100 characters" }, 400);
    }

    if (
      input.description !== undefined &&
      input.description !== null &&
      typeof input.description !== "string"
    ) {
      return jsonResponse(
        { error: "Description must be a string or null" },
        400,
      );
    }
    const description = input.description?.trim() || null;
    if (description && description.length > 500) {
      return jsonResponse(
        { error: "Description must be at most 500 characters" },
        400,
      );
    }

    const { data, error } = await getSupabaseClient()
      .from(getTaskTableName())
      .insert({
        title,
        description,
        status: "idle",
      })
      .select("*")
      .single();

    if (error) {
      return logDatabaseError("create", error);
    }
    return jsonResponse(data, 201);
  } catch (error) {
    return logApiError("Create", error);
  }
}

export async function getTasks() {
  try {
    const { data, error } = await getSupabaseClient()
      .from(getTaskTableName())
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return logDatabaseError("get", error);
    }
    return jsonResponse(data ?? []);
  } catch (error) {
    return logApiError("List", error);
  }
}

export async function startTask(request) {
  try {
    const input = await parseJsonRequest(request);
    const id = taskId(input);
    if (!id) {
      return jsonResponse({ error: "Task ID is required" }, 400);
    }

    const { data, error } = await getSupabaseClient()
      .from(getTaskTableName())
      .update({ start_time: new Date().toISOString(), status: "running" })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return logDatabaseError("start", error);
    }
    if (!data) {
      return jsonResponse({ error: "Task not found" }, 404);
    }
    return jsonResponse(data);
  } catch (error) {
    return logApiError("Start", error);
  }
}

export async function endTask(request) {
  try {
    const input = await parseJsonRequest(request);
    const id = taskId(input);
    if (!id) {
      return jsonResponse({ error: "Task ID is required" }, 400);
    }

    const { data, error } = await getSupabaseClient()
      .from(getTaskTableName())
      .update({ end_time: new Date().toISOString(), status: "completed" })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return logDatabaseError("end", error);
    }
    if (!data) {
      return jsonResponse({ error: "Task not found" }, 404);
    }
    return jsonResponse(data);
  } catch (error) {
    return logApiError("End", error);
  }
}

export async function deleteTask(request) {
  try {
    const input = await parseJsonRequest(request);
    const id = taskId(input);
    if (!id) {
      return jsonResponse({ error: "Task ID is required" }, 400);
    }

    const { data, error } = await getSupabaseClient()
      .from(getTaskTableName())
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return logDatabaseError("delete", error);
    }
    if (!data) {
      return jsonResponse({ error: "Task not found" }, 404);
    }
    return jsonResponse({ success: true });
  } catch (error) {
    return logApiError("Delete", error);
  }
}
