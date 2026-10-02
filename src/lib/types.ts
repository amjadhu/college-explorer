export type SettingBucket = "city" | "suburb" | "town" | "rural" | "unknown";

export type RankingSource = {
  name: string;
  url: string;
  fetchedAt: string;
  fallbackUsed?: boolean;
  fallbackFrom?: string;
};

export type MajorShare = {
  key: string;
  label: string;
  share: number;
};

export type DataQuality = {
  hasAdmissions: boolean;
  hasCost: boolean;
  hasEarnings: boolean;
  hasCoords: boolean;
};

export type CollegeRecord = {
  rank: number;
  slug: string;
  displayName: string;
  forbesName: string;
  scorecardName: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  locale: string | number | null;
  settingBucket: SettingBucket;
  settingLabel: string;
  ownership: number | null;
  enrollment: number | null;
  admissionRate: number | null;
  tuitionInState: number | null;
  tuitionOutOfState: number | null;
  costOfAttendance: number | null;
  graduationRate: number | null;
  medianEarnings10y: number | null;
  latitude: number | null;
  longitude: number | null;
  scorecardId: number | null;

  // SAT/ACT scores
  satAvgScore: number | null;
  actCumulativeMidpoint: number | null;
  satMath25: number | null;
  satMath75: number | null;
  satReading25: number | null;
  satReading75: number | null;

  // Retention & student life
  retentionRate: number | null;
  studentFacultyRatio: number | null;
  percentFemale: number | null;
  percentPartTime: number | null;

  // Demographics
  percentWhite: number | null;
  percentBlack: number | null;
  percentHispanic: number | null;
  percentAsian: number | null;

  // Financial aid
  percentReceivingAid: number | null;
  avgNetPrice: number | null;
  medianDebt: number | null;
  federalLoanRate: number | null;
  federalLoanDefaultRate: number | null;

  // Institution classification
  carnegieClassification: number | null;
  carnegieLabel: string;
  religiousAffiliation: number | null;
  religiousLabel: string;

  // Safety
  crimeTotalOnCampus: number | null;
  crimeRate: number | null;

  // Majors
  topMajors: MajorShare[];
  allMajors: MajorShare[];

  dataQuality: DataQuality;
  rankingSource: RankingSource;
};

export type Filters = {
  query: string;
  state: string;
  ownership: "all" | "public" | "private";
  locale: "all" | "city" | "suburb" | "town" | "rural";
  satRange: "all" | "1400+" | "1200-1399" | "1000-1199" | "below-1000";
  sizeRange: "all" | "small" | "medium" | "large";
  view: "cards" | "list";
};

export type ShortlistState = {
  slugs: string[];
  updatedAt: string;
};

export type CompareState = {
  slugs: string[];
};

// ---- Preference Engine Types ----

export type DimensionKey =
  | "academicRigor"
  | "careerOutcomes"
  | "financialValue"
  | "safetyWellbeing"
  | "campusLifeCulture"
  | "locationEnvironment"
  | "programStrength";

export type FamilyPreferences = {
  weights: Record<DimensionKey, number>; // 0-100 per dimension
  interests: string[]; // major keys user is interested in
  homeLatitude: number | null;
  homeLongitude: number | null;
  homeLabel: string; // e.g. "Dallas, TX"
};

export type SchoolStatus =
  | "researching"
  | "interested"
  | "applying"
  | "applied"
  | "accepted"
  | "rejected"
  | "waitlisted";

export type WorkspaceEntry = {
  slug: string;
  status: SchoolStatus;
  notes: string;
  addedAt: string;
  updatedAt: string;
};

export type WorkspaceState = {
  entries: WorkspaceEntry[];
  updatedAt: string;
};
