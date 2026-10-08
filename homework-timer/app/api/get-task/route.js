import { getTasks } from "@/lib/task-api";

export async function GET(request) {
  void request.url;
  return getTasks();
}
