import type { CollegeRecord, DimensionKey, FamilyPreferences } from "@/lib/types";
import { buildPercentileLookup, getPercentile } from "@/lib/percentiles";
import { distanceFromHome } from "@/lib/distance";

export type DimensionScore = {
  key: DimensionKey;
  label: string;
  score: number; // 0-100
  available: boolean;
};

export type FamilyScore = {
  total: number; // 0-100
  dimensions: DimensionScore[];
};

export const dimensionLabels: Record<DimensionKey, string> = {
  academicRigor: "Academic Rigor",
  careerOutcomes: "Career Outcomes",
  financialValue: "Financial Value",
  safetyWellbeing: "Safety & Wellbeing",
  campusLifeCulture: "Campus Life & Culture",
  locationEnvironment: "Location & Environment",
  programStrength: "Program Strength",
};

// Each dimension maps to concrete data fields with sub-weights (must sum to 1.0 within dimension)
type SubField = {
  accessor: (c: CollegeRecord) => number | null;
  lookupKey: string;
  weight: number;
  invert?: boolean; // true = lower is better (e.g., admission rate, cost)
};

const dimensionFields: Record<DimensionKey, SubField[]> = {
  academicRigor: [
    { accessor: (c) => c.admissionRate, lookupKey: "admissionRate", weight: 0.3, invert: true },
    { accessor: (c) => c.satAvgScore, lookupKey: "satAvgScore", weight: 0.25 },
    { accessor: (c) => c.actCumulativeMidpoint, lookupKey: "actCumulativeMidpoint", weight: 0.15 },
    { accessor: (c) => c.retentionRate, lookupKey: "retentionRate", weight: 0.15 },
    { accessor: (c) => c.graduationRate, lookupKey: "graduationRate", weight: 0.15 },
  ],
  careerOutcomes: [
    { accessor: (c) => c.medianEarnings10y, lookupKey: "medianEarnings10y", weight: 0.55 },
    { accessor: (c) => c.graduationRate, lookupKey: "graduationRate", weight: 0.25 },
    { accessor: (c) => c.federalLoanDefaultRate, lookupKey: "federalLoanDefaultRate", weight: 0.2, invert: true },
  ],
  financialValue: [
    { accessor: (c) => c.avgNetPrice, lookupKey: "avgNetPrice", weight: 0.35, invert: true },
    { accessor: (c) => c.medianDebt, lookupKey: "medianDebt", weight: 0.25, invert: true },
    { accessor: (c) => c.percentReceivingAid, lookupKey: "percentReceivingAid", weight: 0.2 },
    { accessor: (c) => c.medianEarnings10y, lookupKey: "medianEarnings10y", weight: 0.2 },
  ],
  safetyWellbeing: [
    { accessor: (c) => c.crimeRate, lookupKey: "crimeRate", weight: 0.4, invert: true },
    { accessor: (c) => c.retentionRate, lookupKey: "retentionRate", weight: 0.35 },
    { accessor: (c) => c.studentFacultyRatio, lookupKey: "studentFacultyRatio", weight: 0.25, invert: true },
  ],
  campusLifeCulture: [
    { accessor: (c) => c.enrollment, lookupKey: "enrollment", weight: 0.3 },
    { accessor: (c) => c.percentPartTime, lookupKey: "percentPartTime", weight: 0.3, invert: true },
    { accessor: (c) => c.studentFacultyRatio, lookupKey: "studentFacultyRatio", weight: 0.4, invert: true },
  ],
  locationEnvironment: [
    // Distance from home is handled specially — not a fixed percentile field
    { accessor: (c) => c.enrollment, lookupKey: "enrollment", weight: 1.0 },
  ],
  programStrength: [
    // This dimension is computed differently — based on interest match
    { accessor: (c) => c.admissionRate, lookupKey: "admissionRate", weight: 1.0, invert: true },
  ],
};

// Build all the percentile lookup keys from dimension fields
const allAccessors: Record<string, (c: CollegeRecord) => number | null> = {};
for (const fields of Object.values(dimensionFields)) {
  for (const field of fields) {
    if (!allAccessors[field.lookupKey]) {
      allAccessors[field.lookupKey] = field.accessor;
    }
  }
}

export function buildScoringContext(colleges: CollegeRecord[]) {
  return buildPercentileLookup(colleges, allAccessors);
}

function scoreDimension(
  college: CollegeRecord,
  dimension: DimensionKey,
  lookup: Record<string, number[]>,
  preferences: FamilyPreferences
): { score: number; available: boolean } {
  // Special handling for programStrength
  if (dimension === "programStrength") {
    return scoreProgramStrength(college, preferences);
  }

  // Special handling for locationEnvironment with home coordinates
  if (dimension === "locationEnvironment") {
    return scoreLocation(college, preferences, lookup);
  }

  const fields = dimensionFields[dimension];
  let weightSum = 0;
  let scoreSum = 0;

  for (const field of fields) {
    const value = field.accessor(college);
    const percentile = getPercentile(value, lookup[field.lookupKey] ?? []);
    if (percentile == null) continue;

    const adjusted = field.invert ? 100 - percentile : percentile;
    scoreSum += adjusted * field.weight;
    weightSum += field.weight;
  }

  if (weightSum === 0) return { score: 50, available: false };
  return { score: Math.round(scoreSum / weightSum), available: true };
}

function scoreProgramStrength(
  college: CollegeRecord,
  preferences: FamilyPreferences
): { score: number; available: boolean } {
  if (preferences.interests.length === 0) {
    // No interests set, use overall academic breadth
    const totalMajors = college.allMajors.length;
    return { score: Math.min(100, totalMajors * 5), available: totalMajors > 0 };
  }

  const interestKeys = new Set(preferences.interests);
  const matchingMajors = college.allMajors.filter((m) => interestKeys.has(m.key));

  if (matchingMajors.length === 0) {
    return { score: 10, available: true };
  }

  // Score based on how strongly the school offers the student's interests
  const totalShare = matchingMajors.reduce((sum, m) => sum + m.share, 0);
  // Normalize: 30%+ total share in interests = 100, scale linearly
  const shareScore = Math.min(100, (totalShare / 0.3) * 100);
  // Also reward breadth of matching interests
  const breadthScore = (matchingMajors.length / preferences.interests.length) * 100;

  const score = Math.round(shareScore * 0.6 + breadthScore * 0.4);
  return { score: Math.min(100, score), available: true };
}

function scoreLocation(
  college: CollegeRecord,
  preferences: FamilyPreferences,
  lookup: Record<string, number[]>
): { score: number; available: boolean } {
  if (preferences.homeLatitude == null || preferences.homeLongitude == null) {
    // No home set — just use a neutral midpoint
    return { score: 50, available: false };
  }

  const dist = distanceFromHome(
    preferences.homeLatitude,
    preferences.homeLongitude,
    college.latitude,
    college.longitude
  );

  if (dist == null) return { score: 50, available: false };

  // Closer is better, but we use a curve — 0 miles=100, 500 miles=60, 1500 miles=30, 3000+=10
  let score: number;
  if (dist <= 50) score = 100;
  else if (dist <= 200) score = 90 - ((dist - 50) / 150) * 15;
  else if (dist <= 500) score = 75 - ((dist - 200) / 300) * 20;
  else if (dist <= 1500) score = 55 - ((dist - 500) / 1000) * 25;
  else score = Math.max(10, 30 - ((dist - 1500) / 1500) * 20);

  return { score: Math.round(score), available: true };
}

export function computeFamilyScore(
  college: CollegeRecord,
  preferences: FamilyPreferences,
  lookup: Record<string, number[]>
): FamilyScore {
  const dimensions: DimensionScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const key of Object.keys(dimensionLabels) as DimensionKey[]) {
    const { score, available } = scoreDimension(college, key, lookup, preferences);
    const weight = preferences.weights[key];

    dimensions.push({
      key,
      label: dimensionLabels[key],
      score,
      available,
    });

    if (weight > 0) {
      totalWeightedScore += score * weight;
      totalWeight += weight;
    }
  }

  const total = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50;

  return { total, dimensions };
}

/** Rank all colleges by Family Score descending. */
export function rankByFamilyScore(
  colleges: CollegeRecord[],
  preferences: FamilyPreferences
): Array<{ college: CollegeRecord; familyScore: FamilyScore }> {
  const lookup = buildScoringContext(colleges);

  return colleges
    .map((college) => ({
      college,
      familyScore: computeFamilyScore(college, preferences, lookup),
    }))
    .sort((a, b) => b.familyScore.total - a.familyScore.total);
}
