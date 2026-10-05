import { createProject } from "../actions";
import ProjectForm from "../project-form";
import AdminDisabled from "../disabled";
import { isAdminEnabled } from "../store";

export const metadata = { title: "New Project — Admin" };

export default function NewProjectPage() {
  if (!isAdminEnabled()) {
    return <AdminDisabled />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-charcoal-900">
        New Project
      </h1>
      <ProjectForm action={createProject} submitLabel="Create Project" />
    </main>
  );
}
