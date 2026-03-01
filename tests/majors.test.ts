import test from "node:test";
import assert from "node:assert/strict";
import { extractTopMajors } from "../scripts/majors";

test("extractTopMajors returns top majors sorted by share", () => {
  const majors = extractTopMajors({
    "latest.academics.program_percentage.engineering": 0.12,
    "latest.academics.program_percentage.computer": 0.21,
    "latest.academics.program_percentage.business_marketing": 0.15,
    "latest.academics.program_percentage.psychology": 0.08
  }, 3);

  assert.equal(majors.length, 3);
  assert.equal(majors[0].key, "computer");
  assert.equal(majors[1].key, "business");
  assert.equal(majors[2].key, "engineering");
});
