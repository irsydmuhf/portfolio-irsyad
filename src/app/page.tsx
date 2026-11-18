import HeroCard from "@/components/home/HeroCard";
import ProfileSection from "@/components/home/ProfileSection";
import SiteFooter from "@/components/home/SiteFooter";
import ProjectGrid from "@/components/ProjectGrid";
import { getHomeContent } from "@/lib/content/home";

// ISR: homepage reads settings, experience, education, skills and published
// projects from Supabase (plans/portfolio-cms-v2.md Phases 3 & 16). Admin
// mutations revalidatePath("/") on save/publish.
export const revalidate = 300;

export default async function Home() {
  const {
    settings,
    printerProject,
    experiences,
    educations,
    skillCategories,
    techStack,
    achievements,
    projects,
    source,
  } = await getHomeContent();

  return (
    <div className="bg-dots min-h-screen">
      {source === "local" && (
        <p className="bg-sun-300 px-4 py-2 text-center text-xs font-semibold text-ink">
          Dev preview: Supabase is unreachable, showing bundled local content.
        </p>
      )}

      <main className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:space-y-8 sm:px-6 sm:py-10">
        <HeroCard
          name={settings.displayName}
          roleLine={settings.roleLine}
          availability={settings.availabilityText}
          location={settings.location}
          printerProject={printerProject}
          screen={{
            line1: settings.screenLine1,
            line2: settings.screenLine2,
            query: settings.screenQuery,
          }}
          tag={{ text: settings.tagText, url: settings.tagUrl }}
        />

        <ProfileSection
          settings={settings}
          experiences={experiences}
          educations={educations}
          skillCategories={skillCategories}
          techStack={techStack}
          achievements={achievements}
        />

        <section
          id="projects"
          aria-labelledby="projects-title"
          className="scroll-mt-6 rounded-[2.5rem] bg-white px-4 py-10 shadow-[0_30px_60px_-40px_rgba(30,60,140,.35)] ring-1 ring-black/5 sm:px-10 sm:py-14 lg:px-14"
        >
          <ProjectGrid projects={projects} />
        </section>
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
