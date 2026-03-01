import test from "node:test";
import assert from "node:assert/strict";
import { compareHighlights, compareMetrics } from "../src/lib/compare";
import { makeCollege } from "./helpers";

test("compareHighlights selects best and caution based on metric direction", () => {
  const colleges = [
    makeCollege({ slug: "a", admissionRate: 0.08, costOfAttendance: 70000 }),
    makeCollege({ slug: "b", admissionRate: 0.25, costOfAttendance: 55000 }),
    makeCollege({ slug: "c", admissionRate: 0.15, costOfAttendance: 62000 })
  ];

  const acceptanceMetric = compareMetrics.find((metric) => metric.key === "admissionRate");
  const costMetric = compareMetrics.find((metric) => metric.key === "costOfAttendance");
  assert.ok(acceptanceMetric);
  assert.ok(costMetric);

  const acceptance = compareHighlights(colleges, acceptanceMetric!);
  assert.ok(acceptance.best.has("a"));
  assert.ok(acceptance.caution.has("b"));

  const cost = compareHighlights(colleges, costMetric!);
  assert.ok(cost.best.has("b"));
  assert.ok(cost.caution.has("a"));
});
