import { createTask } from "@/lib/task-api";

export async function POST(request) {
  return createTask(request);
}
