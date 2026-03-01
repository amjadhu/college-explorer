import type { MajorShare } from "../src/lib/types";

export type ProgramField = {
  key: string;
  field: string;
  label: string;
};

export const programFields: ProgramField[] = [
  { key: "engineering", field: "latest.academics.program_percentage.engineering", label: "Engineering" },
  { key: "business", field: "latest.academics.program_percentage.business_marketing", label: "Business & Marketing" },
  { key: "computer", field: "latest.academics.program_percentage.computer", label: "Computer Science" },
  { key: "health", field: "latest.academics.program_percentage.health", label: "Health Professions" },
  { key: "social_science", field: "latest.academics.program_percentage.social_science", label: "Social Sciences" },
  { key: "biological", field: "latest.academics.program_percentage.biological", label: "Biological Sciences" },
  { key: "psychology", field: "latest.academics.program_percentage.psychology", label: "Psychology" },
  { key: "visual_performing", field: "latest.academics.program_percentage.visual_performing", label: "Visual & Performing Arts" },
  { key: "education", field: "latest.academics.program_percentage.education", label: "Education" },
  { key: "communication", field: "latest.academics.program_percentage.communication", label: "Communication & Journalism" },
  { key: "humanities", field: "latest.academics.program_percentage.humanities", label: "Humanities" },
  { key: "mathematics", field: "latest.academics.program_percentage.mathematics", label: "Mathematics" }
];

export function extractTopMajors(scorecard: Record<string, unknown> | null, limit = 3): MajorShare[] {
  if (!scorecard) return [];

  return programFields
    .map((field) => ({
      key: field.key,
      label: field.label,
      share: Number(scorecard[field.field])
    }))
    .filter((item) => Number.isFinite(item.share) && item.share > 0)
    .sort((a, b) => b.share - a.share)
    .slice(0, limit);
}
