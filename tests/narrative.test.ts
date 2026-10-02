import test from "node:test";
import assert from "node:assert/strict";
import { interpretStat, generateStrengths, generateConcerns } from "../src/lib/narrative";
import { computeFamilyScore, buildScoringContext } from "../src/lib/scoring";
import { defaultPreferences } from "../src/lib/preferences-storage";
import { makeCollege } from "./helpers";

test("interpretStat returns contextual interpretation for admission rate", () => {
  const colleges = [
    makeCollege({ slug: "a", admissionRate: 0.05 }),
    makeCollege({ slug: "b", admissionRate: 0.5 }),
    makeCollege({ slug: "c", admissionRate: 0.9 }),
  ];

  const result = interpretStat("admissionRate", colleges[0], colleges);
  assert.ok(result);
  assert.equal(result.label, "Acceptance Rate");
  assert.equal(result.bandLabel, "Extremely selective");
  assert.ok(result.context.length > 0);
});

test("interpretStat returns null for missing data", () => {
  const colleges = [makeCollege({ admissionRate: null })];
  const result = interpretStat("admissionRate", colleges[0], colleges);
  assert.equal(result, null);
});

test("generateStrengths produces points for strong school", () => {
  const colleges = [
    makeCollege({ slug: "strong", medianEarnings10y: 120000, avgNetPrice: 8000, retentionRate: 0.98, graduationRate: 0.97 }),
    makeCollege({ slug: "avg", medianEarnings10y: 50000, avgNetPrice: 30000, retentionRate: 0.75, graduationRate: 0.6 }),
  ];

  const prefs = defaultPreferences();
  const lookup = buildScoringContext(colleges);
  const score = computeFamilyScore(colleges[0], prefs, lookup);
  const strengths = generateStrengths(colleges[0], score, prefs, colleges);

  assert.ok(strengths.length > 0, "Should generate at least one strength");
  assert.ok(strengths.every((s) => s.headline.length > 0 && s.detail.length > 0));
});

test("generateConcerns produces points for expensive school", () => {
  const colleges = [
    makeCollege({ slug: "expensive", avgNetPrice: 55000, medianDebt: 40000 }),
    makeCollege({ slug: "cheap", avgNetPrice: 10000, medianDebt: 8000 }),
  ];

  const prefs = defaultPreferences();
  const lookup = buildScoringContext(colleges);
  const score = computeFamilyScore(colleges[0], prefs, lookup);
  const concerns = generateConcerns(colleges[0], score, prefs, colleges);

  assert.ok(concerns.length > 0, "Should generate at least one concern");
});
