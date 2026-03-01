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
