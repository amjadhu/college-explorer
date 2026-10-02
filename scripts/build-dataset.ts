import { extractAllMajors, extractTopMajors } from "./majors";
import { extractProgramData } from "./enrich-scorecard";
import { carnegieLabel, religiousLabel } from "./lookup-tables";
import { readScorecardData, writeFinalData } from "./lib";
import { localeBucket, settingLabelFromBucket } from "../src/lib/format";

function num(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function crimeRatePer1000(totalCrimes: number | null, enrollment: number | null): number | null {
  if (totalCrimes == null || enrollment == null || enrollment === 0) return null;
  return Math.round((totalCrimes / enrollment) * 1000 * 100) / 100;
}

async function main() {
  const enriched = await readScorecardData();

  const colleges = enriched.colleges
    .map(({ rankItem, scorecard }) => {
      const admissionRate = num(scorecard?.["latest.admissions.admission_rate.overall"]);
      const costOfAttendance = num(scorecard?.["latest.cost.attendance.academic_year"]);
      const medianEarnings10y = num(scorecard?.["latest.earnings.10_yrs_after_entry.median"]);
      const latitude = num(scorecard?.["location.lat"]);
      const longitude = num(scorecard?.["location.lon"]);
      const locale = (scorecard?.["school.locale"] as string | number | undefined) ?? null;
      const settingBucket = localeBucket(locale);
      const enrollment = num(scorecard?.["latest.student.size"]);
      const crimeTotalOnCampus = num(scorecard?.["latest.campus_safety.crime.criminal_offense.total"]);
      const carnegieCode = num(scorecard?.["school.carnegie_basic"]);
      const religiousCode = num(scorecard?.["school.religious_affiliation"]);

      // Extract program-level earnings/debt data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const programData = extractProgramData(scorecard as any);

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
        ownership: num(scorecard?.["school.ownership"]),
        enrollment,
        admissionRate,
        tuitionInState: num(scorecard?.["latest.cost.tuition.in_state"]),
        tuitionOutOfState: num(scorecard?.["latest.cost.tuition.out_of_state"]),
        costOfAttendance,
        graduationRate: num(scorecard?.["latest.completion.rate_suppressed.overall"]),
        medianEarnings10y,
        latitude,
        longitude,
        scorecardId: num(scorecard?.id),

        // New SAT/ACT fields
        satAvgScore: num(scorecard?.["latest.admissions.sat_scores.average.overall"]),
        actCumulativeMidpoint: num(scorecard?.["latest.admissions.act_scores.midpoint.cumulative"]),
        satMath25: num(scorecard?.["latest.admissions.sat_scores.25th_percentile.math"]),
        satMath75: num(scorecard?.["latest.admissions.sat_scores.75th_percentile.math"]),
        satReading25: num(scorecard?.["latest.admissions.sat_scores.25th_percentile.critical_reading"]),
        satReading75: num(scorecard?.["latest.admissions.sat_scores.75th_percentile.critical_reading"]),

        // Retention & student life
        retentionRate: num(scorecard?.["latest.student.retention_rate.four_year.full_time"]),
        studentFacultyRatio: num(scorecard?.["latest.student.student_faculty_ratio"]),
        percentFemale: num(scorecard?.["latest.student.demographics.female_share"]),
        percentPartTime: num(scorecard?.["latest.student.part_time_share"]),

        // Demographics
        percentWhite: num(scorecard?.["latest.student.demographics.race_ethnicity.white"]),
        percentBlack: num(scorecard?.["latest.student.demographics.race_ethnicity.black"]),
        percentHispanic: num(scorecard?.["latest.student.demographics.race_ethnicity.hispanic"]),
        percentAsian: num(scorecard?.["latest.student.demographics.race_ethnicity.asian"]),

        // Financial aid
        percentReceivingAid: num(scorecard?.["latest.aid.pell_grant_rate"]),
        avgNetPrice: num(scorecard?.["latest.cost.avg_net_price.overall"]),
        medianDebt: num(scorecard?.["latest.aid.median_debt.completers.overall"]),
        federalLoanRate: num(scorecard?.["latest.aid.federal_loan_rate"]),
        federalLoanDefaultRate: num(scorecard?.["latest.repayment.3_yr_default_rate"]),

        // Institution classification
        carnegieClassification: carnegieCode,
        carnegieLabel: carnegieLabel(carnegieCode),
        religiousAffiliation: religiousCode,
        religiousLabel: religiousLabel(religiousCode),

        // Crime
        crimeTotalOnCampus,
        crimeRate: crimeRatePer1000(crimeTotalOnCampus, enrollment),

        // Majors (now with program-level earnings/debt)
        topMajors: extractTopMajors(scorecard ?? null, 3, programData),
        allMajors: extractAllMajors(scorecard ?? null, programData),

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
