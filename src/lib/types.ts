export type CollegeRecord = {
  rank: number;
  slug: string;
  forbesName: string;
  scorecardName: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  locale: string | null;
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
  rankingSource: {
    name: string;
    url: string;
    fetchedAt: string;
  };
};

export type Filters = {
  query: string;
  state: string;
  ownership: "all" | "public" | "private";
  locale: "all" | "city" | "suburb" | "town" | "rural";
};
