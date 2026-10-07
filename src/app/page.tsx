import HomeClient from "@/components/HomeClient";
import { getFeaturedProjects } from "@/lib/projects/queries";

// ISR: homepage reads published projects from Supabase (Phase 3 of
// plans/portfolio-cms-v2.md). Admin mutations revalidatePath("/") on publish.
export const revalidate = 300;

export default async function Home() {
  const projects = await getFeaturedProjects();
  return <HomeClient projects={projects} />;
}
