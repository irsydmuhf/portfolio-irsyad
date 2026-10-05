import { experience } from "@/data/experience";

export default function Experience() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-charcoal-900">Experience</h2>

      <div className="mt-6 space-y-6">
        {experience.map((exp) => (
          <div
            key={`${exp.period}-${exp.type}`}
            className="rounded-lg border border-charcoal-200 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-accent-500">
                  {exp.period}
                </p>
                <h3 className="mt-1 text-xl font-bold text-charcoal-900">
                  {exp.role}
                </h3>
                <p className="text-lg text-charcoal-600">{exp.company}</p>
                <p className="text-sm text-charcoal-500">{exp.division}</p>
              </div>
              <span className="rounded-full bg-charcoal-100 px-3 py-1 text-xs font-medium text-charcoal-700">
                {exp.type}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {exp.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full bg-accent-50 px-3 py-1 text-sm text-accent-700"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
