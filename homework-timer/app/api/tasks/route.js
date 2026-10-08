import { settleExpiredTimer } from "@/lib/timer";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { withTimerState } from "@/lib/timer-store";

export async function GET(request) {
  // This database-backed handler must use the incoming request, not prerender at build time.
  void request.url;

  try {
    const tasks = await withTimerState((state) => {
      settleExpiredTimer(state);
      return state.completedTasks;
    });

    return jsonResponse({ tasks });
  } catch (error) {
    return errorResponse(error);
  }
}
