import { extractTopMajors } from "./majors";
import { readScorecardData, writeFinalData } from "./lib";
import { localeBucket, settingLabelFromBucket } from "../src/lib/format";

async function main() {
  const enriched = await readScorecardData();

  const colleges = enriched.colleges
    .map(({ rankItem, scorecard }) => {
      const admissionRate = (scorecard?.["latest.admissions.admission_rate.overall"] as number | undefined) ?? null;
      const costOfAttendance = (scorecard?.["latest.cost.attendance.academic_year"] as number | undefined) ?? null;
      const medianEarnings10y = (scorecard?.["latest.earnings.10_yrs_after_entry.median"] as number | undefined) ?? null;
      const latitude = (scorecard?.["location.lat"] as number | undefined) ?? null;
      const longitude = (scorecard?.["location.lon"] as number | undefined) ?? null;
      const locale = (scorecard?.["school.locale"] as string | number | undefined) ?? null;
      const settingBucket = localeBucket(locale);

      return {
        rank: rankItem.rank,
        slug: rankItem.slug,
        displayName: rankItem.name,
        forbesName: rankItem.name,
        scorecardName: (scorecard?.["school.name"] as string | undefined) ?? null,
        city: (scorecard?.["school.city"] as string | undefined) ?? null,
        state: (scorecard?.["school.state"] as string | undefined) ?? null,
        website: (scorecard?.["school.school_url"] as string | undefined) ?? null,
        locale,
        settingBucket,
        settingLabel: settingLabelFromBucket(settingBucket),
        ownership: (scorecard?.["school.ownership"] as number | undefined) ?? null,
        enrollment: (scorecard?.["latest.student.size"] as number | undefined) ?? null,
        admissionRate,
        tuitionInState: (scorecard?.["latest.cost.tuition.in_state"] as number | undefined) ?? null,
        tuitionOutOfState: (scorecard?.["latest.cost.tuition.out_of_state"] as number | undefined) ?? null,
        costOfAttendance,
        graduationRate: (scorecard?.["latest.completion.rate_suppressed.overall"] as number | undefined) ?? null,
        medianEarnings10y,
        latitude,
        longitude,
        scorecardId: (scorecard?.id as number | undefined) ?? null,
        topMajors: extractTopMajors(scorecard ?? null, 3),
        dataQuality: {
          hasAdmissions: admissionRate !== null,
          hasCost: costOfAttendance !== null,
          hasEarnings: medianEarnings10y !== null,
          hasCoords: latitude !== null && longitude !== null
        },
        rankingSource: {
          name: enriched.source.name,
          url: enriched.source.url,
          fetchedAt: enriched.fetchedAt,
          fallbackUsed: Boolean((enriched.source as { fallbackUsed?: boolean }).fallbackUsed),
          fallbackFrom: (enriched.source as { fallbackFrom?: string }).fallbackFrom
        }
      };
    })
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
