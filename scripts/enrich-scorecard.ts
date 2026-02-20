import { readForbesData, scoreName, writeScorecardData } from "./lib";

type ScorecardSchool = {
  id: number;
  "school.name": string;
  "school.city": string | null;
  "school.state": string | null;
  "school.school_url": string | null;
  "school.locale": string | null;
  "school.ownership": number | null;
  "location.lat": number | null;
  "location.lon": number | null;
  "latest.student.size": number | null;
  "latest.admissions.admission_rate.overall": number | null;
  "latest.cost.tuition.in_state": number | null;
  "latest.cost.tuition.out_of_state": number | null;
  "latest.cost.avg_net_price.overall": number | null;
  "latest.completion.rate_suppressed.overall": number | null;
  "latest.earnings.10_yrs_after_entry.median": number | null;
};

const endpoint = "https://api.data.gov/ed/collegescorecard/v1/schools";

const fields = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.locale",
  "school.ownership",
  "location.lat",
  "location.lon",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.avg_net_price.overall",
  "latest.completion.rate_suppressed.overall",
  "latest.earnings.10_yrs_after_entry.median"
].join(",");

async function fetchSchoolByName(apiKey: string, name: string): Promise<ScorecardSchool | null> {
  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("school.name", name);
  params.set("_per_page", "8");
  params.set("fields", fields);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch(`${endpoint}?${params.toString()}`);

    if (!res.ok) {
      // Retry transient server errors/rate limits, then gracefully skip.
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
  const forbes = await readForbesData();

  if (!apiKey) {
    console.warn("COLLEGE_SCORECARD_API_KEY is missing. Writing dataset with Forbes rankings only.");
    await writeScorecardData({
      source: forbes.source,
      fetchedAt: new Date().toISOString(),
      colleges: forbes.colleges.map((college) => ({ forbes: college, scorecard: null }))
    });
    return;
  }
  const enriched: Array<{ forbes: (typeof forbes.colleges)[number]; scorecard: ScorecardSchool | null }> = [];

  for (const item of forbes.colleges) {
    const row = await fetchSchoolByName(apiKey, item.name);
    enriched.push({ forbes: item, scorecard: row });
    console.log(`Matched #${item.rank} ${item.name}: ${row?.["school.name"] ?? "NOT FOUND"}`);
  }

  await writeScorecardData({
    source: forbes.source,
    fetchedAt: new Date().toISOString(),
    colleges: enriched
  });

  const found = enriched.filter((i) => i.scorecard).length;
  console.log(`Enriched ${found}/${forbes.colleges.length} colleges using College Scorecard.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
