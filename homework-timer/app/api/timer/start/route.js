import { startTimer } from "@/lib/timer-endpoints";

export async function POST(request) {
  return startTimer(request);
}
