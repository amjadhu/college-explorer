import type { CollegeRecord, FamilyPreferences } from "@/lib/types";
import type { FamilyScore } from "@/lib/scoring";
import { buildPercentileLookup, getPercentile } from "@/lib/percentiles";
import {
  admissionBand,
  satBand,
  costBand,
  earningsBand,
  retentionBand,
  graduationBand,
  ratioband,
  crimeRateBand,
  debtBand,
} from "@/lib/context-bands";
import { formatMoney, formatPercent, formatSAT, formatRatio } from "@/lib/format";

export type StatInterpretation = {
  label: string;
  value: string;
  bandLabel: string;
  context: string;
  percentile: number | null;
};

/** Interpret a single stat with context. */
export function interpretStat(
  field: string,
  college: CollegeRecord,
  allColleges: CollegeRecord[]
): StatInterpretation | null {
  switch (field) {
    case "admissionRate": {
      const v = college.admissionRate;
      if (v == null) return null;
      const band = admissionBand(v);
      const pctls = allColleges.map((c) => c.admissionRate).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Acceptance Rate", value: formatPercent(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "satAvgScore": {
      const v = college.satAvgScore;
      if (v == null) return null;
      const band = satBand(v);
      const pctls = allColleges.map((c) => c.satAvgScore).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Average SAT", value: formatSAT(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "avgNetPrice": {
      const v = college.avgNetPrice;
      if (v == null) return null;
      const band = costBand(v);
      const pctls = allColleges.map((c) => c.avgNetPrice).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Average Net Price", value: formatMoney(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "medianEarnings10y": {
      const v = college.medianEarnings10y;
      if (v == null) return null;
      const band = earningsBand(v);
      const pctls = allColleges.map((c) => c.medianEarnings10y).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Median Earnings (10yr)", value: formatMoney(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "retentionRate": {
      const v = college.retentionRate;
      if (v == null) return null;
      const band = retentionBand(v);
      const pctls = allColleges.map((c) => c.retentionRate).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Freshman Retention", value: formatPercent(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "graduationRate": {
      const v = college.graduationRate;
      if (v == null) return null;
      const band = graduationBand(v);
      const pctls = allColleges.map((c) => c.graduationRate).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Graduation Rate", value: formatPercent(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "studentFacultyRatio": {
      const v = college.studentFacultyRatio;
      if (v == null) return null;
      const band = ratioband(v);
      const pctls = allColleges.map((c) => c.studentFacultyRatio).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Student-Faculty Ratio", value: formatRatio(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "crimeRate": {
      const v = college.crimeRate;
      if (v == null) return null;
      const band = crimeRateBand(v);
      const pctls = allColleges.map((c) => c.crimeRate).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Crime Rate (per 1,000)", value: v.toFixed(1), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    case "medianDebt": {
      const v = college.medianDebt;
      if (v == null) return null;
      const band = debtBand(v);
      const pctls = allColleges.map((c) => c.medianDebt).filter((x): x is number => x != null).sort((a, b) => a - b);
      return { label: "Median Debt at Graduation", value: formatMoney(v), bandLabel: band.label, context: band.description, percentile: getPercentile(v, pctls) };
    }
    default:
      return null;
  }
}

// All stat fields we generate interpretations for
const allStatFields = [
  "admissionRate", "satAvgScore", "avgNetPrice", "medianEarnings10y",
  "retentionRate", "graduationRate", "studentFacultyRatio", "crimeRate", "medianDebt",
];

/** Get all available stat interpretations for a college. */
export function interpretAllStats(
  college: CollegeRecord,
  allColleges: CollegeRecord[]
): StatInterpretation[] {
  return allStatFields
    .map((field) => interpretStat(field, college, allColleges))
    .filter((s): s is StatInterpretation => s != null);
}

// ---- Strengths & Concerns ----

export type NarrativePoint = {
  headline: string;
  detail: string;
};

/** Generate "Why this could be great" based on family preferences + school data. */
export function generateStrengths(
  college: CollegeRecord,
  familyScore: FamilyScore,
  preferences: FamilyPreferences,
  allColleges: CollegeRecord[]
): NarrativePoint[] {
  const points: NarrativePoint[] = [];
  const lookup = buildPercentileLookup(allColleges, {
    medianEarnings10y: (c) => c.medianEarnings10y,
    avgNetPrice: (c) => c.avgNetPrice,
    admissionRate: (c) => c.admissionRate,
    retentionRate: (c) => c.retentionRate,
    graduationRate: (c) => c.graduationRate,
    satAvgScore: (c) => c.satAvgScore,
  });

  // Strong earnings
  const earningsPctl = getPercentile(college.medianEarnings10y, lookup.medianEarnings10y ?? []);
  if (earningsPctl != null && earningsPctl >= 70) {
    points.push({
      headline: "Strong career outcomes",
      detail: `Graduates earn ${formatMoney(college.medianEarnings10y)} at 10 years — higher than ${Math.round(earningsPctl)}% of schools in this group.`,
    });
  }

  // Good value
  const costPctl = getPercentile(college.avgNetPrice, lookup.avgNetPrice ?? []);
  if (costPctl != null && costPctl <= 35) {
    points.push({
      headline: "Good financial value",
      detail: `Average net price of ${formatMoney(college.avgNetPrice)} is lower than most peers — strong aid programs help.`,
    });
  }

  // High retention
  const retPctl = getPercentile(college.retentionRate, lookup.retentionRate ?? []);
  if (retPctl != null && retPctl >= 75) {
    points.push({
      headline: "Students love it here",
      detail: `${formatPercent(college.retentionRate)} of freshmen return — a sign that students are satisfied and thriving.`,
    });
  }

  // High graduation
  const gradPctl = getPercentile(college.graduationRate, lookup.graduationRate ?? []);
  if (gradPctl != null && gradPctl >= 75) {
    points.push({
      headline: "Strong completion rate",
      detail: `${formatPercent(college.graduationRate)} graduation rate — students who start here tend to finish.`,
    });
  }

  // Program match
  if (preferences.interests.length > 0) {
    const interestKeys = new Set(preferences.interests);
    const matches = college.allMajors.filter((m) => interestKeys.has(m.key));
    if (matches.length > 0) {
      const names = matches.slice(0, 3).map((m) => m.label).join(", ");
      points.push({
        headline: "Offers your areas of interest",
        detail: `Has programs in ${names} — matching what your family is looking for.`,
      });
    }
  }

  // Top dimension from family score
  const topDim = [...familyScore.dimensions]
    .filter((d) => d.available)
    .sort((a, b) => b.score - a.score)[0];
  if (topDim && topDim.score >= 70) {
    points.push({
      headline: `Excels in ${topDim.label}`,
      detail: `Scored ${topDim.score}/100 on ${topDim.label} — one of this school's strongest dimensions for your family.`,
    });
  }

  return points.slice(0, 4);
}

/** Generate "What to watch out for" — honest concerns. */
export function generateConcerns(
  college: CollegeRecord,
  familyScore: FamilyScore,
  preferences: FamilyPreferences,
  allColleges: CollegeRecord[]
): NarrativePoint[] {
  const points: NarrativePoint[] = [];
  const lookup = buildPercentileLookup(allColleges, {
    avgNetPrice: (c) => c.avgNetPrice,
    medianDebt: (c) => c.medianDebt,
    crimeRate: (c) => c.crimeRate,
    admissionRate: (c) => c.admissionRate,
  });

  // High cost
  const costPctl = getPercentile(college.avgNetPrice, lookup.avgNetPrice ?? []);
  if (costPctl != null && costPctl >= 70) {
    points.push({
      headline: "Higher than average cost",
      detail: `Net price of ${formatMoney(college.avgNetPrice)} is higher than ${Math.round(costPctl)}% of schools — compare financial aid offers carefully.`,
    });
  }

  // High debt
  const debtPctl = getPercentile(college.medianDebt, lookup.medianDebt ?? []);
  if (debtPctl != null && debtPctl >= 70) {
    points.push({
      headline: "Graduates carry more debt",
      detail: `Median debt of ${formatMoney(college.medianDebt)} is higher than most peers — factor monthly payments into your planning.`,
    });
  }

  // Crime rate
  const crimePctl = getPercentile(college.crimeRate, lookup.crimeRate ?? []);
  if (crimePctl != null && crimePctl >= 70) {
    points.push({
      headline: "Above-average campus incidents",
      detail: `Crime rate of ${college.crimeRate?.toFixed(1)} per 1,000 students is higher than most — review specific incident types.`,
    });
  }

  // Very selective (hard to get in)
  if (college.admissionRate != null && college.admissionRate < 0.15) {
    points.push({
      headline: "Extremely competitive admission",
      detail: `Only ${formatPercent(college.admissionRate)} of applicants are admitted — have a balanced list with safety schools.`,
    });
  }

  // Missing programs
  if (preferences.interests.length > 0) {
    const interestKeys = new Set(preferences.interests);
    const majorKeys = new Set(college.allMajors.map((m) => m.key));
    const missing = preferences.interests.filter((k) => !majorKeys.has(k));
    if (missing.length > 0 && missing.length === preferences.interests.length) {
      points.push({
        headline: "Doesn't offer your key interests",
        detail: `None of your selected areas of interest appear to have significant enrollment here.`,
      });
    }
  }

  // Weakest weighted dimension
  const weakDim = [...familyScore.dimensions]
    .filter((d) => d.available && preferences.weights[d.key] >= 30)
    .sort((a, b) => a.score - b.score)[0];
  if (weakDim && weakDim.score <= 35) {
    points.push({
      headline: `Weaker on ${weakDim.label}`,
      detail: `Scored ${weakDim.score}/100 on ${weakDim.label} — an area your family rated as important.`,
    });
  }

  return points.slice(0, 4);
}

/** Generate a one-line trade-off comparison for two schools on a dimension. */
export function tradeOffSummary(
  schoolA: CollegeRecord,
  schoolB: CollegeRecord,
  scoreA: FamilyScore,
  scoreB: FamilyScore,
  dimensionKey: string
): string {
  const dimA = scoreA.dimensions.find((d) => d.key === dimensionKey);
  const dimB = scoreB.dimensions.find((d) => d.key === dimensionKey);
  if (!dimA || !dimB) return "";

  const diff = dimA.score - dimB.score;
  if (Math.abs(diff) < 5) {
    return `${schoolA.displayName} and ${schoolB.displayName} are similar on ${dimA.label}.`;
  }

  const stronger = diff > 0 ? schoolA.displayName : schoolB.displayName;
  const weaker = diff > 0 ? schoolB.displayName : schoolA.displayName;
  return `${stronger} is stronger for ${dimA.label}, but ${weaker} may have other advantages.`;
}
