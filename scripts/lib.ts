import fs from "node:fs/promises";
import path from "node:path";

export type RankItem = {
  rank: number;
  name: string;
  slug: string;
};

const RANKING_OUTPUT = path.join(process.cwd(), "data", "raw", "ranking-top75.json");
const SCORECARD_OUTPUT = path.join(process.cwd(), "data", "raw", "scorecard-enriched.json");
const FINAL_OUTPUT = path.join(process.cwd(), "data", "top75-colleges.json");

export async function writeRankingData(data: object) {
  await fs.mkdir(path.dirname(RANKING_OUTPUT), { recursive: true });
  await fs.writeFile(RANKING_OUTPUT, JSON.stringify(data, null, 2));
}

export async function readRankingData(): Promise<{
  source: { name: string; url: string; fetchedAt: string };
  colleges: RankItem[];
}> {
  const raw = await fs.readFile(RANKING_OUTPUT, "utf-8");
  return JSON.parse(raw);
}

export async function writeScorecardData(data: object) {
  await fs.mkdir(path.dirname(SCORECARD_OUTPUT), { recursive: true });
  await fs.writeFile(SCORECARD_OUTPUT, JSON.stringify(data, null, 2));
}

export async function readScorecardData(): Promise<{
  source: { name: string; url: string; fetchedAt: string };
  fetchedAt: string;
  colleges: Array<{ rankItem: RankItem; scorecard: Record<string, unknown> | null }>;
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

  const a = left.split(" ").filter(Boolean);
  const b = right.split(" ").filter(Boolean);
  const setA = new Set(a);
  const setB = new Set(b);
  const intersect = [...setA].filter((t) => setB.has(t)).length;
  // Jaccard-style: reward overlap, penalize extra tokens on either side
  const union = new Set([...a, ...b]).size;
  return Math.round((intersect / Math.max(union, 1)) * 90);
};
