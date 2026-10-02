import type { CollegeRecord } from "@/lib/types";
import type { FamilyScore } from "@/lib/scoring";
import { dimensionLabels } from "@/lib/scoring";
import type { DimensionKey } from "@/lib/types";

export type CompareMetric = {
  key: string;
  label: string;
  kind: "money" | "percent" | "count" | "text";
  accessor: (college: CollegeRecord) => number | string | null;
  direction: "higher" | "lower";
};

export const compareMetrics: CompareMetric[] = [
  {
    key: "admissionRate",
    label: "Acceptance rate",
    kind: "percent",
    accessor: (college) => college.admissionRate,
    direction: "lower"
  },
  {
    key: "costOfAttendance",
    label: "Cost of attendance",
    kind: "money",
    accessor: (college) => college.costOfAttendance,
    direction: "lower"
  },
  {
    key: "avgNetPrice",
    label: "Average net price",
    kind: "money",
    accessor: (college) => college.avgNetPrice,
    direction: "lower"
  },
  {
    key: "medianEarnings10y",
    label: "Median earnings (10y)",
    kind: "money",
    accessor: (college) => college.medianEarnings10y,
    direction: "higher"
  },
  {
    key: "graduationRate",
    label: "Graduation rate",
    kind: "percent",
    accessor: (college) => college.graduationRate,
    direction: "higher"
  },
  {
    key: "retentionRate",
    label: "Freshman retention",
    kind: "percent",
    accessor: (college) => college.retentionRate,
    direction: "higher"
  },
  {
    key: "satAvgScore",
    label: "Average SAT",
    kind: "count",
    accessor: (college) => college.satAvgScore,
    direction: "higher"
  },
  {
    key: "studentFacultyRatio",
    label: "Student-faculty ratio",
    kind: "count",
    accessor: (college) => college.studentFacultyRatio,
    direction: "lower"
  },
  {
    key: "medianDebt",
    label: "Median debt",
    kind: "money",
    accessor: (college) => college.medianDebt,
    direction: "lower"
  },
  {
    key: "enrollment",
    label: "Enrollment",
    kind: "count",
    accessor: (college) => college.enrollment,
    direction: "higher"
  }
];

export function compareHighlights(colleges: CollegeRecord[], metric: CompareMetric) {
  const rows = colleges
    .map((college) => ({
      slug: college.slug,
      value: metric.accessor(college)
    }))
    .filter((row): row is { slug: string; value: number } => typeof row.value === "number" && Number.isFinite(row.value));

  if (!rows.length) {
    return { best: new Set<string>(), caution: new Set<string>() };
  }

  const values = rows.map((row) => row.value);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const bestValue = metric.direction === "higher" ? max : min;
  const cautionValue = metric.direction === "higher" ? min : max;

  return {
    best: new Set(rows.filter((row) => row.value === bestValue).map((row) => row.slug)),
    caution: new Set(rows.filter((row) => row.value === cautionValue).map((row) => row.slug))
  };
}

/** Generate dimension trade-off text for two colleges. */
export function generateTradeoffs(
  collegeA: CollegeRecord,
  collegeB: CollegeRecord,
  scoreA: FamilyScore,
  scoreB: FamilyScore
): Array<{ dimension: string; text: string }> {
  const results: Array<{ dimension: string; text: string }> = [];

  for (const key of Object.keys(dimensionLabels) as DimensionKey[]) {
    const dimA = scoreA.dimensions.find((d) => d.key === key);
    const dimB = scoreB.dimensions.find((d) => d.key === key);
    if (!dimA || !dimB) continue;

    const diff = dimA.score - dimB.score;
    const label = dimensionLabels[key];

    let text: string;
    if (Math.abs(diff) < 5) {
      text = `${collegeA.displayName} and ${collegeB.displayName} are similar on ${label}.`;
    } else if (diff > 0) {
      text = `${collegeA.displayName} is stronger for ${label} (${dimA.score} vs ${dimB.score}), but ${collegeB.displayName} may have other advantages.`;
    } else {
      text = `${collegeB.displayName} is stronger for ${label} (${dimB.score} vs ${dimA.score}), but ${collegeA.displayName} may have other advantages.`;
    }

    results.push({ dimension: label, text });
  }

  return results;
}
