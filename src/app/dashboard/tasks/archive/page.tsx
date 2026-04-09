import { redirect } from "next/navigation";

export default async function ArchivedTasksPage() {
  redirect("/dashboard/archive");
}
