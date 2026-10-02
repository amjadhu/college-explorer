import type { CollegeRecord, Filters } from "@/lib/types";
import { localeBucket, ownershipLabel } from "@/lib/format";

const text = (value: unknown): string => (typeof value === "string" ? value.toLowerCase() : "");

function matchesSATRange(college: CollegeRecord, range: Filters["satRange"]): boolean {
  if (range === "all") return true;
  const sat = college.satAvgScore;
  if (sat == null) return true; // show schools without SAT data in all ranges
  switch (range) {
    case "1400+": return sat >= 1400;
    case "1200-1399": return sat >= 1200 && sat < 1400;
    case "1000-1199": return sat >= 1000 && sat < 1200;
    case "below-1000": return sat < 1000;
    default: return true;
  }
}

function matchesSizeRange(college: CollegeRecord, range: Filters["sizeRange"]): boolean {
  if (range === "all") return true;
  const size = college.enrollment;
  if (size == null) return true;
  switch (range) {
    case "small": return size < 5000;
    case "medium": return size >= 5000 && size < 15000;
    case "large": return size >= 15000;
    default: return true;
  }
}

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

    return (
      matchesQuery &&
      matchesState &&
      matchesOwnership &&
      matchesLocale &&
      matchesSATRange(college, filters.satRange) &&
      matchesSizeRange(college, filters.sizeRange)
    );
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
