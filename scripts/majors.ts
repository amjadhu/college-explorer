import type { MajorShare } from "../src/lib/types";

export type ProgramField = {
  key: string;
  field: string;
  label: string;
  cipPrefix: string; // 2-digit CIP code prefix for matching program-level data
};

export const programFields: ProgramField[] = [
  { key: "engineering", field: "latest.academics.program_percentage.engineering", label: "Engineering", cipPrefix: "14" },
  { key: "business", field: "latest.academics.program_percentage.business_marketing", label: "Business & Marketing", cipPrefix: "52" },
  { key: "computer", field: "latest.academics.program_percentage.computer", label: "Computer Science", cipPrefix: "11" },
  { key: "health", field: "latest.academics.program_percentage.health", label: "Health Professions", cipPrefix: "51" },
  { key: "social_science", field: "latest.academics.program_percentage.social_science", label: "Social Sciences", cipPrefix: "45" },
  { key: "biological", field: "latest.academics.program_percentage.biological", label: "Biological Sciences", cipPrefix: "26" },
  { key: "psychology", field: "latest.academics.program_percentage.psychology", label: "Psychology", cipPrefix: "42" },
  { key: "visual_performing", field: "latest.academics.program_percentage.visual_performing", label: "Visual & Performing Arts", cipPrefix: "50" },
  { key: "education", field: "latest.academics.program_percentage.education", label: "Education", cipPrefix: "13" },
  { key: "communication", field: "latest.academics.program_percentage.communication", label: "Communication & Journalism", cipPrefix: "09" },
  { key: "humanities", field: "latest.academics.program_percentage.humanities", label: "Humanities", cipPrefix: "24" },
  { key: "mathematics", field: "latest.academics.program_percentage.mathematics", label: "Mathematics", cipPrefix: "27" },
  { key: "physical_science", field: "latest.academics.program_percentage.physical_science", label: "Physical Sciences", cipPrefix: "40" },
  { key: "history", field: "latest.academics.program_percentage.history", label: "History", cipPrefix: "54" },
  { key: "english", field: "latest.academics.program_percentage.english", label: "English", cipPrefix: "23" },
  { key: "philosophy_religious", field: "latest.academics.program_percentage.philosophy_religious", label: "Philosophy & Religious Studies", cipPrefix: "38" },
  { key: "ethnic_cultural_gender", field: "latest.academics.program_percentage.ethnic_cultural_gender", label: "Ethnic, Cultural & Gender Studies", cipPrefix: "05" },
  { key: "architecture", field: "latest.academics.program_percentage.architecture", label: "Architecture", cipPrefix: "04" },
  { key: "resources", field: "latest.academics.program_percentage.resources", label: "Natural Resources & Conservation", cipPrefix: "03" },
  { key: "legal", field: "latest.academics.program_percentage.legal", label: "Legal Professions", cipPrefix: "22" },
  { key: "security_law_enforcement", field: "latest.academics.program_percentage.security_law_enforcement", label: "Criminal Justice & Law Enforcement", cipPrefix: "43" },
  { key: "public_administration_social_service", field: "latest.academics.program_percentage.public_administration_social_service", label: "Public Administration & Social Service", cipPrefix: "44" },
  { key: "parks_recreation_fitness", field: "latest.academics.program_percentage.parks_recreation_fitness", label: "Parks, Recreation & Fitness", cipPrefix: "31" },
  { key: "family_consumer_science", field: "latest.academics.program_percentage.family_consumer_science", label: "Family & Consumer Sciences", cipPrefix: "19" },
  { key: "multidiscipline", field: "latest.academics.program_percentage.multidiscipline", label: "Multi/Interdisciplinary Studies", cipPrefix: "30" },
  { key: "language", field: "latest.academics.program_percentage.language", label: "Foreign Languages & Linguistics", cipPrefix: "16" },
  { key: "theology_religious_vocation", field: "latest.academics.program_percentage.theology_religious_vocation", label: "Theology & Religious Vocations", cipPrefix: "39" },
];

export type ProgramData = {
  cipCode: string;
  title: string;
  credentialLevel: number;
  medianEarnings: number | null;
  medianDebt: number | null;
};

export function extractTopMajors(
  scorecard: Record<string, unknown> | null,
  limit = 3,
  programData?: ProgramData[]
): MajorShare[] {
  if (!scorecard) return [];

  return programFields
    .map((field) => {
      const earnings = findProgramEarnings(field.cipPrefix, programData);
      return {
        key: field.key,
        label: field.label,
        share: Number(scorecard[field.field]),
        medianEarnings: earnings?.medianEarnings ?? null,
        medianDebt: earnings?.medianDebt ?? null,
      };
    })
    .filter((item) => Number.isFinite(item.share) && item.share > 0)
    .sort((a, b) => b.share - a.share)
    .slice(0, limit);
}

export function extractAllMajors(
  scorecard: Record<string, unknown> | null,
  programData?: ProgramData[]
): MajorShare[] {
  if (!scorecard) return [];

  return programFields
    .map((field) => {
      const earnings = findProgramEarnings(field.cipPrefix, programData);
      return {
        key: field.key,
        label: field.label,
        share: Number(scorecard[field.field]),
        medianEarnings: earnings?.medianEarnings ?? null,
        medianDebt: earnings?.medianDebt ?? null,
      };
    })
    .filter((item) => Number.isFinite(item.share) && item.share > 0)
    .sort((a, b) => b.share - a.share);
}

function findProgramEarnings(
  cipPrefix: string,
  programData?: ProgramData[]
): { medianEarnings: number | null; medianDebt: number | null } | null {
  if (!programData || programData.length === 0) return null;

  // Find programs matching this CIP prefix, prefer bachelor's (credential level 3)
  const matches = programData.filter((p) => p.cipCode.startsWith(cipPrefix));
  if (matches.length === 0) return null;

  // Prefer bachelor's level (3), then highest credential level
  const bachelors = matches.find((p) => p.credentialLevel === 3);
  const best = bachelors ?? matches.sort((a, b) => b.credentialLevel - a.credentialLevel)[0];

  return {
    medianEarnings: best.medianEarnings,
    medianDebt: best.medianDebt,
  };
}
