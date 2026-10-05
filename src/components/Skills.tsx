import { skillCategories } from "@/data/skills";

export default function Skills() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-charcoal-900">Education</h2>
        <div className="mt-4 rounded-lg border border-charcoal-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">
                S.Kom. — Bachelor of Computer Science
              </h3>
              <p className="text-charcoal-600">
                Universitas Muhammadiyah Magelang
              </p>
              <p className="mt-1 text-sm text-charcoal-500">GPA 3.80 / 4.00</p>
            </div>
            <div className="rounded-lg bg-accent-50 px-3 py-2">
              <span className="text-sm font-semibold text-accent-600">CADS</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-charcoal-100 px-3 py-1 text-xs font-medium text-charcoal-700">
              Certified Associate Data Scientist
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-charcoal-900">
          Skills & Tools
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {skillCategories.map((category) => (
            <div
              key={category.name}
              className="rounded-lg border border-charcoal-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-500">
                {category.name}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-charcoal-100 px-3 py-1 text-xs font-medium text-charcoal-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
