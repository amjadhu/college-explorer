import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { CollegeRecord } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "data", "top50-colleges.json");

export const readColleges = cache(async (): Promise<CollegeRecord[]> => {
  try {
    const file = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(file) as { colleges: CollegeRecord[] };
    return parsed.colleges.sort((a, b) => a.rank - b.rank);
  } catch {
    return [];
  }
});

export const getCollegeBySlug = cache(async (slug: string) => {
  const colleges = await readColleges();
  return colleges.find((c) => c.slug === slug) ?? null;
});

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

export const localeBucket = (locale: string | null): "city" | "suburb" | "town" | "rural" | "unknown" => {
  if (!locale) return "unknown";
  const normalized = locale.toLowerCase();
  if (normalized.includes("city")) return "city";
  if (normalized.includes("suburb")) return "suburb";
  if (normalized.includes("town")) return "town";
  if (normalized.includes("rural")) return "rural";
  return "unknown";
};
