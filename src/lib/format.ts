export type LocaleBucket = "city" | "suburb" | "town" | "rural" | "unknown";

export const formatMoney = (value: number | null): string => {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercent = (value: number | null): string => {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
};

export const ownershipLabel = (ownership: number | null): "Public" | "Private" | "N/A" => {
  if (ownership === 1) return "Public";
  if (ownership === 2 || ownership === 3) return "Private";
  return "N/A";
};

export const localeBucket = (locale: unknown): LocaleBucket => {
  if (locale == null) return "unknown";

  const code = Number(locale);
  if (!Number.isNaN(code)) {
    if ([11, 12, 13].includes(code)) return "city";
    if ([21, 22, 23].includes(code)) return "suburb";
    if ([31, 32, 33].includes(code)) return "town";
    if ([41, 42, 43].includes(code)) return "rural";
  }

  if (typeof locale !== "string") return "unknown";
  const normalized = locale.toLowerCase();
  if (normalized.includes("city")) return "city";
  if (normalized.includes("suburb")) return "suburb";
  if (normalized.includes("town")) return "town";
  if (normalized.includes("rural")) return "rural";
  return "unknown";
};

export const localeLabel = (locale: unknown): string => {
  const bucket = localeBucket(locale);
  if (bucket === "unknown") return "Unknown setting";
  return bucket[0].toUpperCase() + bucket.slice(1);
};
