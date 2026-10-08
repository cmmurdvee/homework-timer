import { performTimerAction } from "@/lib/timer-endpoints";

export async function POST() {
  return performTimerAction("complete");
}
