import type { CollegeRecord } from "../src/lib/types";

export function makeCollege(overrides: Partial<CollegeRecord> = {}): CollegeRecord {
  return {
    rank: 1,
    slug: "sample-college",
    displayName: "Sample College",
    forbesName: "Sample College",
    scorecardName: "Sample College",
    city: "Boston",
    state: "MA",
    website: "example.edu",
    locale: 11,
    settingBucket: "city",
    settingLabel: "City",
    ownership: 2,
    enrollment: 5000,
    admissionRate: 0.2,
    tuitionInState: 12000,
    tuitionOutOfState: 30000,
    costOfAttendance: 45000,
    graduationRate: 0.9,
    medianEarnings10y: 95000,
    latitude: 42.36,
    longitude: -71.05,
    scorecardId: 1,

    // SAT/ACT
    satAvgScore: 1400,
    actCumulativeMidpoint: 32,
    satMath25: 680,
    satMath75: 780,
    satReading25: 670,
    satReading75: 760,

    // Retention & student life
    retentionRate: 0.96,
    studentFacultyRatio: 6,
    percentFemale: 0.48,
    percentPartTime: 0.03,

    // Demographics
    percentWhite: 0.4,
    percentBlack: 0.08,
    percentHispanic: 0.12,
    percentAsian: 0.22,

    // Financial aid
    percentReceivingAid: 0.55,
    avgNetPrice: 18000,
    medianDebt: 12000,
    federalLoanRate: 0.15,
    federalLoanDefaultRate: 0.01,

    // Classification
    carnegieClassification: 15,
    carnegieLabel: "Doctoral University — Very High Research",
    religiousAffiliation: null,
    religiousLabel: "Not affiliated",

    // Safety
    crimeTotalOnCampus: 25,
    crimeRate: 5.0,

    // Majors
    topMajors: [
      { key: "engineering", label: "Engineering", share: 0.3 },
      { key: "business", label: "Business & Marketing", share: 0.2 }
    ],
    allMajors: [
      { key: "engineering", label: "Engineering", share: 0.3 },
      { key: "business", label: "Business & Marketing", share: 0.2 },
      { key: "computer", label: "Computer Science", share: 0.15 },
      { key: "biological", label: "Biological Sciences", share: 0.1 }
    ],
    dataQuality: {
      hasAdmissions: true,
      hasCost: true,
      hasEarnings: true,
      hasCoords: true
    },
    rankingSource: {
      name: "Test",
      url: "https://example.com",
      fetchedAt: "2026-02-20T00:00:00.000Z"
    },
    ...overrides
  };
}
