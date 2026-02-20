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
