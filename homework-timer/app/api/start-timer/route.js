import { startTask } from "@/lib/task-api";

export async function POST(request) {
  return startTask(request);
}
