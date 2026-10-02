import test from "node:test";
import assert from "node:assert/strict";
import { filterColleges } from "../src/lib/explorer";
import type { Filters } from "../src/lib/types";
import { makeCollege } from "./helpers";

const baseFilters: Filters = {
  query: "",
  state: "all",
  ownership: "all",
  locale: "all",
  satRange: "all",
  sizeRange: "all",
  view: "cards"
};

test("filterColleges filters by query, state, ownership, and setting", () => {
  const colleges = [
    makeCollege({ slug: "mit", displayName: "MIT", state: "MA", ownership: 2, settingBucket: "city" }),
    makeCollege({ slug: "uf", displayName: "University of Florida", state: "FL", ownership: 1, settingBucket: "city" }),
    makeCollege({ slug: "dartmouth", displayName: "Dartmouth College", state: "NH", ownership: 2, settingBucket: "rural" })
  ];

  assert.equal(filterColleges(colleges, { ...baseFilters, query: "florida" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, state: "MA" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, ownership: "public" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, locale: "rural" }).length, 1);
});

test("filterColleges filters by SAT range", () => {
  const colleges = [
    makeCollege({ slug: "a", satAvgScore: 1500 }),
    makeCollege({ slug: "b", satAvgScore: 1300 }),
    makeCollege({ slug: "c", satAvgScore: 1100 }),
    makeCollege({ slug: "d", satAvgScore: 950 }),
  ];

  assert.equal(filterColleges(colleges, { ...baseFilters, satRange: "1400+" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, satRange: "1200-1399" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, satRange: "1000-1199" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, satRange: "below-1000" }).length, 1);
});

test("filterColleges filters by size range", () => {
  const colleges = [
    makeCollege({ slug: "small", enrollment: 2000 }),
    makeCollege({ slug: "medium", enrollment: 8000 }),
    makeCollege({ slug: "large", enrollment: 30000 }),
  ];

  assert.equal(filterColleges(colleges, { ...baseFilters, sizeRange: "small" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, sizeRange: "medium" }).length, 1);
  assert.equal(filterColleges(colleges, { ...baseFilters, sizeRange: "large" }).length, 1);
});
