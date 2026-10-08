import {
  cancelTimer,
  remainingSeconds,
  settleExpiredTimer,
} from "@/lib/timer";
import { errorResponse, jsonResponse } from "@/lib/api-response";
import { withTimerState } from "@/lib/timer-store";

export async function GET(request) {
  // This database-backed handler must use the incoming request, not prerender at build time.
  void request.url;

  try {
    const timer = await withTimerState((state) => {
      settleExpiredTimer(state);
      if (!state.activeTimer) {
        return null;
      }

      return {
        ...state.activeTimer,
        remainingSeconds: remainingSeconds(state.activeTimer),
      };
    });

    return jsonResponse({ timer });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  try {
    await withTimerState((state) => cancelTimer(state));
    return jsonResponse({ timer: null });
  } catch (error) {
    return errorResponse(error);
  }
}
