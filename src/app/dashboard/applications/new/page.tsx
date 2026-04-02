import { ApplicationForm } from "@/components/applications/application-form";

export default function NewApplicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Application
        </h1>
        <p className="text-sm text-gray-600">
          Save a new job opportunity to your tracker.
        </p>
      </div>

      <ApplicationForm />
    </div>
  );
}
