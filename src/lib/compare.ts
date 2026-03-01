import type { CollegeRecord } from "@/lib/types";

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
