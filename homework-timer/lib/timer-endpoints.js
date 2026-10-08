import { createTimer, updateTimer } from "@/lib/timer";
import {
  errorResponse,
  jsonResponse,
  parseJsonRequest,
} from "@/lib/api-response";
import { withTimerState } from "@/lib/timer-store";

export async function startTimer(request) {
  try {
    const input = await parseJsonRequest(request);
    const timer = await withTimerState((state) => createTimer(state, input));
    return jsonResponse({ timer }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function performTimerAction(action) {
  try {
    const timer = await withTimerState((state) => updateTimer(state, action));
    return jsonResponse({ timer });
  } catch (error) {
    return errorResponse(error);
  }
}
