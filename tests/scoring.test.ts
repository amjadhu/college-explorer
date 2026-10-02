import test from "node:test";
import assert from "node:assert/strict";
import { computeFamilyScore, buildScoringContext, rankByFamilyScore } from "../src/lib/scoring";
import { defaultPreferences } from "../src/lib/preferences-storage";
import { makeCollege } from "./helpers";

test("computeFamilyScore returns a score between 0 and 100", () => {
  const colleges = [
    makeCollege({ slug: "a", admissionRate: 0.05, medianEarnings10y: 120000 }),
    makeCollege({ slug: "b", admissionRate: 0.5, medianEarnings10y: 50000 }),
    makeCollege({ slug: "c", admissionRate: 0.8, medianEarnings10y: 35000 }),
  ];

  const prefs = defaultPreferences();
  const lookup = buildScoringContext(colleges);
  const score = computeFamilyScore(colleges[0], prefs, lookup);

  assert.ok(score.total >= 0 && score.total <= 100, `Score ${score.total} should be 0-100`);
  assert.equal(score.dimensions.length, 7, "Should have 7 dimensions");
});

test("rankByFamilyScore returns all colleges sorted by score", () => {
  const colleges = [
    makeCollege({ slug: "low", admissionRate: 0.8, medianEarnings10y: 30000, avgNetPrice: 40000 }),
    makeCollege({ slug: "high", admissionRate: 0.05, medianEarnings10y: 120000, avgNetPrice: 10000 }),
    makeCollege({ slug: "mid", admissionRate: 0.3, medianEarnings10y: 70000, avgNetPrice: 25000 }),
  ];

  const prefs = defaultPreferences();
  const ranked = rankByFamilyScore(colleges, prefs);

  assert.equal(ranked.length, 3);
  // Scores should be in descending order
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].familyScore.total >= ranked[i].familyScore.total,
      `Score at ${i - 1} (${ranked[i - 1].familyScore.total}) should be >= score at ${i} (${ranked[i].familyScore.total})`);
  }
});

test("program strength dimension responds to interest selection", () => {
  const colleges = [
    makeCollege({
      slug: "eng-school",
      allMajors: [
        { key: "engineering", label: "Engineering", share: 0.4, medianEarnings: null, medianDebt: null },
        { key: "computer", label: "Computer Science", share: 0.2, medianEarnings: null, medianDebt: null },
      ]
    }),
    makeCollege({
      slug: "art-school",
      allMajors: [
        { key: "visual_performing", label: "Visual & Performing Arts", share: 0.5, medianEarnings: null, medianDebt: null },
      ]
    }),
  ];

  const prefs = { ...defaultPreferences(), interests: ["engineering", "computer"] };
  const lookup = buildScoringContext(colleges);

  const engScore = computeFamilyScore(colleges[0], prefs, lookup);
  const artScore = computeFamilyScore(colleges[1], prefs, lookup);

  const engProgram = engScore.dimensions.find((d) => d.key === "programStrength");
  const artProgram = artScore.dimensions.find((d) => d.key === "programStrength");

  assert.ok(engProgram!.score > artProgram!.score,
    `Eng school program strength (${engProgram!.score}) should be higher than art school (${artProgram!.score})`);
});
