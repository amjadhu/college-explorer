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
  { key: "mathematics", field: "latest.academics.program_percentage.mathematics", label: "Mathematics" },
  { key: "physical_science", field: "latest.academics.program_percentage.physical_science", label: "Physical Sciences" },
  { key: "history", field: "latest.academics.program_percentage.history", label: "History" },
  { key: "english", field: "latest.academics.program_percentage.english", label: "English" },
  { key: "philosophy_religious", field: "latest.academics.program_percentage.philosophy_religious", label: "Philosophy & Religious Studies" },
  { key: "ethnic_cultural_gender", field: "latest.academics.program_percentage.ethnic_cultural_gender", label: "Ethnic, Cultural & Gender Studies" },
  { key: "architecture", field: "latest.academics.program_percentage.architecture", label: "Architecture" },
  { key: "resources", field: "latest.academics.program_percentage.resources", label: "Natural Resources & Conservation" },
  { key: "legal", field: "latest.academics.program_percentage.legal", label: "Legal Professions" },
  { key: "security_law_enforcement", field: "latest.academics.program_percentage.security_law_enforcement", label: "Criminal Justice & Law Enforcement" },
  { key: "public_administration_social_service", field: "latest.academics.program_percentage.public_administration_social_service", label: "Public Administration & Social Service" },
  { key: "parks_recreation_fitness", field: "latest.academics.program_percentage.parks_recreation_fitness", label: "Parks, Recreation & Fitness" },
  { key: "family_consumer_science", field: "latest.academics.program_percentage.family_consumer_science", label: "Family & Consumer Sciences" },
  { key: "multidiscipline", field: "latest.academics.program_percentage.multidiscipline", label: "Multi/Interdisciplinary Studies" },
  { key: "language", field: "latest.academics.program_percentage.language", label: "Foreign Languages & Linguistics" },
  { key: "theology_religious_vocation", field: "latest.academics.program_percentage.theology_religious_vocation", label: "Theology & Religious Vocations" },
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

export function extractAllMajors(scorecard: Record<string, unknown> | null): MajorShare[] {
  if (!scorecard) return [];

  return programFields
    .map((field) => ({
      key: field.key,
      label: field.label,
      share: Number(scorecard[field.field])
    }))
    .filter((item) => Number.isFinite(item.share) && item.share > 0)
    .sort((a, b) => b.share - a.share);
}
