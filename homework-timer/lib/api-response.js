import { TimerError } from "@/lib/timer";

export function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function parseJsonRequest(request) {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TimerError("Request body must be valid JSON.");
    }
    throw error;
  }
}

export function errorResponse(error) {
  if (error instanceof TimerError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  console.error("Timer API request failed:", error);
  return jsonResponse({ error: "An internal server error occurred." }, 500);
}
