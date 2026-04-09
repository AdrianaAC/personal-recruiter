import { redirect } from "next/navigation";

export default async function ArchivedApplicationsPage() {
  redirect("/dashboard/archive");
}
