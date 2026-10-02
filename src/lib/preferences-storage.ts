import type { DimensionKey, FamilyPreferences } from "@/lib/types";

export const PREFERENCES_STORAGE_KEY = "college-compass:preferences:v1";

const defaultWeights: Record<DimensionKey, number> = {
  academicRigor: 50,
  careerOutcomes: 50,
  financialValue: 50,
  safetyWellbeing: 50,
  campusLifeCulture: 50,
  locationEnvironment: 50,
  programStrength: 50,
};

export function defaultPreferences(): FamilyPreferences {
  return {
    weights: { ...defaultWeights },
    interests: [],
    homeLatitude: null,
    homeLongitude: null,
    homeLabel: "",
  };
}

export function readPreferences(storage: Pick<Storage, "getItem">): FamilyPreferences {
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return defaultPreferences();

    const parsed = JSON.parse(raw) as Partial<FamilyPreferences>;
    const defaults = defaultPreferences();

    const weights = { ...defaults.weights };
    if (parsed.weights && typeof parsed.weights === "object") {
      for (const key of Object.keys(defaults.weights) as DimensionKey[]) {
        const val = (parsed.weights as Record<string, unknown>)[key];
        if (typeof val === "number" && val >= 0 && val <= 100) {
          weights[key] = val;
        }
      }
    }

    return {
      weights,
      interests: Array.isArray(parsed.interests)
        ? parsed.interests.filter((v): v is string => typeof v === "string")
        : [],
      homeLatitude: typeof parsed.homeLatitude === "number" ? parsed.homeLatitude : null,
      homeLongitude: typeof parsed.homeLongitude === "number" ? parsed.homeLongitude : null,
      homeLabel: typeof parsed.homeLabel === "string" ? parsed.homeLabel : "",
    };
  } catch {
    return defaultPreferences();
  }
}

export function writePreferences(
  storage: Pick<Storage, "setItem">,
  prefs: FamilyPreferences
): void {
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
}
