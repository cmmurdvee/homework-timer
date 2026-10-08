import { createClient } from "@supabase/supabase-js";

let supabaseClient;

function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getProjectUrl() {
  const value = requiredEnvironmentVariable("SUPABASE_URL");
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("SUPABASE_URL must be a valid Supabase project URL.");
  }

  if (
    !["https:", "http:"].includes(url.protocol) ||
    !["", "/rest/v1"].includes(url.pathname.replace(/\/+$/, ""))
  ) {
    throw new Error(
      "SUPABASE_URL must be a project URL, optionally ending in /rest/v1.",
    );
  }

  return url.origin;
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    const apiKey =
      process.env.SUPABASE_KEY?.trim() ||
      requiredEnvironmentVariable("SUPABASE_SECRET_KEY");

    supabaseClient = createClient(getProjectUrl(), apiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseClient;
}

export function getTaskTableName() {
  const table = process.env.SUPABASE_TASKS_TABLE?.trim() || "tasks";
  if (!/^[a-z_][a-z0-9_]*$/i.test(table)) {
    throw new Error(
      "SUPABASE_TASKS_TABLE must be a valid unqualified database identifier.",
    );
  }
  return table;
}
