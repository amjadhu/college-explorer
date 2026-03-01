import type { CollegeRecord, Filters } from "@/lib/types";
import { localeBucket, ownershipLabel } from "@/lib/format";

const text = (value: unknown): string => (typeof value === "string" ? value.toLowerCase() : "");

export function filterColleges(colleges: CollegeRecord[], filters: Filters): CollegeRecord[] {
  const normalized = filters.query.toLowerCase().trim();

  return colleges.filter((college) => {
    const matchesQuery =
      !normalized ||
      text(college.displayName).includes(normalized) ||
      text(college.forbesName).includes(normalized) ||
      text(college.city).includes(normalized) ||
      text(college.state).includes(normalized);

    const matchesState = filters.state === "all" || college.state === filters.state;
    const label = ownershipLabel(college.ownership).toLowerCase();
    const matchesOwnership = filters.ownership === "all" || label === filters.ownership;
    const setting = college.settingBucket || localeBucket(college.locale);
    const matchesLocale = filters.locale === "all" || setting === filters.locale;

    return matchesQuery && matchesState && matchesOwnership && matchesLocale;
  });
}

export function coverageCounts(colleges: CollegeRecord[]) {
  const total = colleges.length;

  return {
    total,
    admissions: colleges.filter((college) => college.dataQuality.hasAdmissions).length,
    cost: colleges.filter((college) => college.dataQuality.hasCost).length,
    earnings: colleges.filter((college) => college.dataQuality.hasEarnings).length,
    coords: colleges.filter((college) => college.dataQuality.hasCoords).length
  };
}
