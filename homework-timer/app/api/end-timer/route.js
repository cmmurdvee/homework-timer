import { endTask } from "@/lib/task-api";

export async function POST(request) {
  return endTask(request);
}
