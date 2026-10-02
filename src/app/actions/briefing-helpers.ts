"use server";

import { db, schema } from "@/lib/db/client";
import { eq, sql, desc, inArray } from "drizzle-orm";
import type { CollegeBriefingData } from "./briefing";

export type StoredBriefing = {
  id: string;
  slug: string;
  briefingData: CollegeBriefingData;
  model: string;
  generatedAt: string;
};

export async function getBriefing(slug: string): Promise<StoredBriefing | null> {
  const rows = await db
    .select()
    .from(schema.collegeBriefings)
    .where(eq(schema.collegeBriefings.slug, slug))
    .orderBy(desc(schema.collegeBriefings.generatedAt))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    slug: row.slug,
    briefingData: JSON.parse(row.briefingData) as CollegeBriefingData,
    model: row.model,
    generatedAt: row.generatedAt,
  };
}

export async function getBriefingsRemaining(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collegeBriefings)
    .where(sql`${schema.collegeBriefings.generatedAt} LIKE ${today + "%"}`);

  const todayCount = countResult[0]?.count ?? 0;
  return Math.max(0, 20 - todayCount);
}

export async function getBriefingsForSlugs(
  slugs: string[]
): Promise<StoredBriefing[]> {
  if (slugs.length === 0) return [];

  const rows = await db
    .select()
    .from(schema.collegeBriefings)
    .where(inArray(schema.collegeBriefings.slug, slugs));

  // Keep only the latest per slug
  const bySlug = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const existing = bySlug.get(row.slug);
    if (!existing || row.generatedAt > existing.generatedAt) {
      bySlug.set(row.slug, row);
    }
  }

  return Array.from(bySlug.values()).map((row) => ({
    id: row.id,
    slug: row.slug,
    briefingData: JSON.parse(row.briefingData) as CollegeBriefingData,
    model: row.model,
    generatedAt: row.generatedAt,
  }));
}
