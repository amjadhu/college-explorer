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
  topMajors: MajorShare[];
  dataQuality: DataQuality;
  rankingSource: RankingSource;
};

export type Filters = {
  query: string;
  state: string;
  ownership: "all" | "public" | "private";
  locale: "all" | "city" | "suburb" | "town" | "rural";
  view: "cards" | "list";
};

export type ShortlistState = {
  slugs: string[];
  updatedAt: string;
};

export type CompareState = {
  slugs: string[];
};
