import { readRankingData, scoreName, writeScorecardData } from "./lib";
import { programFields } from "./majors";

type ScorecardSchool = {
  id: number;
  "school.name": string;
  "school.city": string | null;
  "school.state": string | null;
  "school.school_url": string | null;
  "school.locale": string | null;
  "school.ownership": number | null;
  "school.carnegie_basic": number | null;
  "school.religious_affiliation": number | null;
  "location.lat": number | null;
  "location.lon": number | null;
  "latest.student.size": number | null;
  "latest.student.demographics.female_share": number | null;
  "latest.student.demographics.race_ethnicity.white": number | null;
  "latest.student.demographics.race_ethnicity.black": number | null;
  "latest.student.demographics.race_ethnicity.hispanic": number | null;
  "latest.student.demographics.race_ethnicity.asian": number | null;
  "latest.student.part_time_share": number | null;
  "latest.student.retention_rate.four_year.full_time": number | null;
  "latest.admissions.admission_rate.overall": number | null;
  "latest.admissions.sat_scores.average.overall": number | null;
  "latest.admissions.sat_scores.25th_percentile.critical_reading": number | null;
  "latest.admissions.sat_scores.75th_percentile.critical_reading": number | null;
  "latest.admissions.sat_scores.25th_percentile.math": number | null;
  "latest.admissions.sat_scores.75th_percentile.math": number | null;
  "latest.admissions.act_scores.midpoint.cumulative": number | null;
  "latest.cost.tuition.in_state": number | null;
  "latest.cost.tuition.out_of_state": number | null;
  "latest.cost.attendance.academic_year": number | null;
  "latest.cost.avg_net_price.overall": number | null;
  "latest.aid.pell_grant_rate": number | null;
  "latest.aid.federal_loan_rate": number | null;
  "latest.aid.median_debt.completers.overall": number | null;
  "latest.aid.loan_principal": number | null;
  "latest.completion.rate_suppressed.overall": number | null;
  "latest.earnings.10_yrs_after_entry.median": number | null;
  "latest.student.FAFSA_applications": number | null;
  "latest.student.student_faculty_ratio": number | null;
  "latest.repayment.3_yr_default_rate": number | null;
  "latest.campus_safety.crime.criminal_offense.total": number | null;
  [key: string]: unknown;
};

const endpoint = "https://api.data.gov/ed/collegescorecard/v1/schools";

const baseFields = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.locale",
  "school.ownership",
  "school.carnegie_basic",
  "school.religious_affiliation",
  "location.lat",
  "location.lon",
  "latest.student.size",
  "latest.student.demographics.female_share",
  "latest.student.demographics.race_ethnicity.white",
  "latest.student.demographics.race_ethnicity.black",
  "latest.student.demographics.race_ethnicity.hispanic",
  "latest.student.demographics.race_ethnicity.asian",
  "latest.student.part_time_share",
  "latest.student.retention_rate.four_year.full_time",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.average.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.midpoint.cumulative",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.attendance.academic_year",
  "latest.cost.avg_net_price.overall",
  "latest.aid.pell_grant_rate",
  "latest.aid.federal_loan_rate",
  "latest.aid.median_debt.completers.overall",
  "latest.aid.loan_principal",
  "latest.completion.rate_suppressed.overall",
  "latest.earnings.10_yrs_after_entry.median",
  "latest.student.student_faculty_ratio",
  "latest.repayment.3_yr_default_rate",
  "latest.campus_safety.crime.criminal_offense.total"
];

const fields = [...baseFields, ...programFields.map((field) => field.field)].join(",");

async function fetchSchoolByName(apiKey: string, name: string): Promise<ScorecardSchool | null> {
  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("school.name", name);
  params.set("_per_page", "8");
  params.set("fields", fields);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch(`${endpoint}?${params.toString()}`);

    if (!res.ok) {
      if ((res.status >= 500 || res.status === 429) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        continue;
      }
      return null;
    }

    const payload = (await res.json()) as { results?: ScorecardSchool[] };
    const results = payload.results ?? [];

    if (!results.length) return null;

    const scored = results
      .map((row) => ({ row, score: scoreName(name, row["school.name"]) }))
      .sort((a, b) => b.score - a.score);

    return scored[0].score >= 40 ? scored[0].row : null;
  }

  return null;
}

async function main() {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  const rankingData = await readRankingData();

  if (!apiKey) {
    console.warn("COLLEGE_SCORECARD_API_KEY is missing. Writing dataset with ranking source only.");
    await writeScorecardData({
      source: rankingData.source,
      fetchedAt: new Date().toISOString(),
      colleges: rankingData.colleges.map((college) => ({ rankItem: college, scorecard: null }))
    });
    return;
  }

  const enriched: Array<{ rankItem: (typeof rankingData.colleges)[number]; scorecard: ScorecardSchool | null }> = [];

  for (const item of rankingData.colleges) {
    const row = await fetchSchoolByName(apiKey, item.name);
    enriched.push({ rankItem: item, scorecard: row });
    console.log(`Matched #${item.rank} ${item.name}: ${row?.["school.name"] ?? "NOT FOUND"}`);
  }

  await writeScorecardData({
    source: rankingData.source,
    fetchedAt: new Date().toISOString(),
    colleges: enriched
  });

  const found = enriched.filter((item) => item.scorecard).length;
  console.log(`Enriched ${found}/${rankingData.colleges.length} colleges using College Scorecard.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
