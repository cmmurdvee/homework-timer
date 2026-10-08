import { deleteTask } from "@/lib/task-api";

export async function DELETE(request) {
  return deleteTask(request);
}
