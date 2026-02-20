import fs from "node:fs/promises";
import path from "node:path";

export type ForbesRankItem = {
  rank: number;
  name: string;
  slug: string;
};

const FORBES_OUTPUT = path.join(process.cwd(), "data", "raw", "forbes-top50.json");
const SCORECARD_OUTPUT = path.join(process.cwd(), "data", "raw", "scorecard-enriched.json");
const FINAL_OUTPUT = path.join(process.cwd(), "data", "top50-colleges.json");

export async function writeForbesData(data: object) {
  await fs.mkdir(path.dirname(FORBES_OUTPUT), { recursive: true });
  await fs.writeFile(FORBES_OUTPUT, JSON.stringify(data, null, 2));
}

export async function readForbesData(): Promise<{
  source: { name: string; url: string; fetchedAt: string };
  colleges: ForbesRankItem[];
}> {
  const raw = await fs.readFile(FORBES_OUTPUT, "utf-8");
  return JSON.parse(raw);
}

export async function writeScorecardData(data: object) {
  await fs.mkdir(path.dirname(SCORECARD_OUTPUT), { recursive: true });
  await fs.writeFile(SCORECARD_OUTPUT, JSON.stringify(data, null, 2));
}

export async function readScorecardData(): Promise<{
  source: { name: string; url: string; fetchedAt: string };
  fetchedAt: string;
  colleges: Array<{ forbes: ForbesRankItem; scorecard: Record<string, unknown> | null }>;
}> {
  const raw = await fs.readFile(SCORECARD_OUTPUT, "utf-8");
  return JSON.parse(raw);
}

export async function writeFinalData(data: object) {
  await fs.mkdir(path.dirname(FINAL_OUTPUT), { recursive: true });
  await fs.writeFile(FINAL_OUTPUT, JSON.stringify(data, null, 2));
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const normalizeName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\b(the|university|college|of|at|and)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const scoreName = (forbesName: string, scorecardName: string): number => {
  if (forbesName.toLowerCase() === scorecardName.toLowerCase()) return 100;
  const left = normalizeName(forbesName);
  const right = normalizeName(scorecardName);
  if (left === right) return 95;
  if (left.includes(right) || right.includes(left)) return 88;

  const a = new Set(left.split(" "));
  const b = new Set(right.split(" "));
  const intersect = [...a].filter((t) => b.has(t)).length;
  return Math.round((intersect / Math.max(a.size, b.size, 1)) * 80);
};
