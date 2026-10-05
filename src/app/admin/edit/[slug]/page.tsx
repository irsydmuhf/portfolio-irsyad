import { notFound } from "next/navigation";
import { updateProject } from "../../actions";
import ProjectForm from "../../project-form";
import AdminDisabled from "../../disabled";
import { readProjects, isAdminEnabled } from "../../store";

export const metadata = { title: "Edit Project — Admin" };

export default async function EditProjectPage(props: {
  params: Promise<{ slug: string }>;
}) {
  if (!isAdminEnabled()) {
    return <AdminDisabled />;
  }

  const { slug } = await props.params;
  const projects = await readProjects();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-charcoal-900">
        Edit Project
      </h1>
      <ProjectForm
        action={updateProject.bind(null, project.slug)}
        initial={project}
        submitLabel="Save Changes"
      />
    </main>
  );
}
