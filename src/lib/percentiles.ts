import type { CollegeRecord } from "@/lib/types";

/**
 * Compute percentile rank (0-100) for a value within a sorted array of values.
 * Uses interpolated percentile: percentage of values strictly less than `value`.
 */
export function percentileRank(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 50;
  if (sortedValues.length === 1) return 50;

  let below = 0;
  for (const v of sortedValues) {
    if (v < value) below++;
  }
  return (below / (sortedValues.length - 1)) * 100;
}

type FieldAccessor = (c: CollegeRecord) => number | null;

/**
 * Precompute sorted arrays of numeric values for a set of fields.
 * Used for fast percentile lookups across the dataset.
 */
export function buildPercentileLookup(
  colleges: CollegeRecord[],
  accessors: Record<string, FieldAccessor>
): Record<string, number[]> {
  const result: Record<string, number[]> = {};

  for (const [key, accessor] of Object.entries(accessors)) {
    const values = colleges
      .map(accessor)
      .filter((v): v is number => v != null && Number.isFinite(v))
      .sort((a, b) => a - b);
    result[key] = values;
  }

  return result;
}

/** Get the percentile of a college on a given field. Returns null if data missing. */
export function getPercentile(
  value: number | null,
  sortedValues: number[]
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (sortedValues.length === 0) return null;
  return percentileRank(value, sortedValues);
}
