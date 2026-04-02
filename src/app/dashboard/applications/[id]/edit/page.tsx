import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditApplicationForm } from "@/components/applications/edit-application-form";

type EditApplicationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApplicationPage({
  params,
}: EditApplicationPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const application = await prisma.jobApplication.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      companyName: true,
      roleTitle: true,
      location: true,
      workMode: true,
      jobUrl: true,
      jobDescription: true,
      status: true,
      priority: true,
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/applications/${application.id}`}
          className="text-sm text-gray-500 underline"
        >
          ← Back to application
        </Link>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit Application
        </h1>

        <p className="text-sm text-gray-600">
          Update the information for this opportunity.
        </p>
      </div>

      <EditApplicationForm application={application} />
    </div>
  );
}
