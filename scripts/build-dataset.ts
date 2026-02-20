import { readScorecardData, writeFinalData } from "./lib";

async function main() {
  const enriched = await readScorecardData();

  const colleges = enriched.colleges
    .map(({ forbes, scorecard }) => ({
      rank: forbes.rank,
      slug: forbes.slug,
      forbesName: forbes.name,
      scorecardName: (scorecard?.["school.name"] as string | undefined) ?? null,
      city: (scorecard?.["school.city"] as string | undefined) ?? null,
      state: (scorecard?.["school.state"] as string | undefined) ?? null,
      website: (scorecard?.["school.school_url"] as string | undefined) ?? null,
      locale: (scorecard?.["school.locale"] as string | undefined) ?? null,
      ownership: (scorecard?.["school.ownership"] as number | undefined) ?? null,
      enrollment: (scorecard?.["latest.student.size"] as number | undefined) ?? null,
      admissionRate: (scorecard?.["latest.admissions.admission_rate.overall"] as number | undefined) ?? null,
      tuitionInState: (scorecard?.["latest.cost.tuition.in_state"] as number | undefined) ?? null,
      tuitionOutOfState: (scorecard?.["latest.cost.tuition.out_of_state"] as number | undefined) ?? null,
      avgNetPrice: (scorecard?.["latest.cost.avg_net_price.overall"] as number | undefined) ?? null,
      graduationRate: (scorecard?.["latest.completion.rate_suppressed.overall"] as number | undefined) ?? null,
      medianEarnings10y: (scorecard?.["latest.earnings.10_yrs_after_entry.median"] as number | undefined) ?? null,
      latitude: (scorecard?.["location.lat"] as number | undefined) ?? null,
      longitude: (scorecard?.["location.lon"] as number | undefined) ?? null,
      scorecardId: (scorecard?.id as number | undefined) ?? null,
      rankingSource: {
        name: enriched.source.name,
        url: enriched.source.url,
        fetchedAt: enriched.fetchedAt
      }
    }))
    .sort((a, b) => a.rank - b.rank);

  await writeFinalData({
    createdAt: new Date().toISOString(),
    colleges
  });

  console.log(`Wrote data/top50-colleges.json with ${colleges.length} colleges.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
