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
    topMajors: [
      { key: "engineering", label: "Engineering", share: 0.3 },
      { key: "business", label: "Business & Marketing", share: 0.2 }
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
