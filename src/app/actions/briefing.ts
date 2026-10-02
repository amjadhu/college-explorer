"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { db, schema } from "@/lib/db/client";
import { readColleges } from "@/lib/data";
import { eq, sql } from "drizzle-orm";
import type { CollegeRecord, FamilyPreferences } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

export type CollegeBriefingData = {
  verdict: "strong_fit" | "good_fit" | "decent_fit" | "uncertain" | "weak_fit";
  oneLiner: string;
  fitAnalysis: string;
  programInsight: string;
  costReality: string;
  strengths: string[];
  risks: string[];
  bottomLine: string;
};

const DAILY_LIMIT = 20;
const MODEL = "claude-haiku-4-20250514";

function buildPrompt(
  college: CollegeRecord,
  preferences: FamilyPreferences | null,
  peerColleges: CollegeRecord[]
): string {
  const programEarnings = college.allMajors
    .filter((m) => m.medianEarnings != null || m.medianDebt != null)
    .map((m) => `  - ${m.label}: ${m.share > 0 ? `${(m.share * 100).toFixed(1)}% enrollment` : ""}${m.medianEarnings ? `, median earnings ${formatMoney(m.medianEarnings)}` : ""}${m.medianDebt ? `, median debt ${formatMoney(m.medianDebt)}` : ""}`)
    .join("\n");

  const peerContext = peerColleges
    .slice(0, 4)
    .map((p) => `  - ${p.displayName}: Net Price ${formatMoney(p.avgNetPrice)}, Earnings ${formatMoney(p.medianEarnings10y)}, Acceptance ${formatPercent(p.admissionRate)}, Median Debt ${formatMoney(p.medianDebt)}`)
    .join("\n");

  const interestsText = preferences?.interests?.length
    ? `Family's academic interests: ${preferences.interests.join(", ")}`
    : "No specific academic interests selected";

  const prioritiesText = preferences
    ? Object.entries(preferences.weights)
        .filter(([, v]) => v > 50)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => `${k}: ${v}/100`)
        .join(", ") || "No strong priorities set"
    : "No preferences set";

  return `You are an honest, data-driven college advisor. Analyze this school for a family considering it.

## School: ${college.displayName}
- Rank: #${college.rank}
- Location: ${college.city}, ${college.state} (${college.settingLabel})
- Type: ${college.ownership === 1 ? "Public" : "Private"}
- Enrollment: ${college.enrollment?.toLocaleString() ?? "N/A"}
- Acceptance Rate: ${formatPercent(college.admissionRate)}
- Average SAT: ${college.satAvgScore ?? "N/A"}
- Graduation Rate: ${formatPercent(college.graduationRate)}
- Retention Rate: ${formatPercent(college.retentionRate)}
- Student-Faculty Ratio: ${college.studentFacultyRatio ? `${college.studentFacultyRatio}:1` : "N/A"}

## Cost & Outcomes
- Average Net Price: ${formatMoney(college.avgNetPrice)}
- Cost of Attendance: ${formatMoney(college.costOfAttendance)}
- Median Debt at Graduation: ${formatMoney(college.medianDebt)}
- Median Earnings (10yr): ${formatMoney(college.medianEarnings10y)}
- Federal Loan Rate: ${formatPercent(college.federalLoanRate)}
- Loan Default Rate: ${formatPercent(college.federalLoanDefaultRate)}

## Program-Level Data (earnings/debt by major)
${programEarnings || "  No program-level earnings data available"}

## Family Context
${interestsText}
Priority weights: ${prioritiesText}
${preferences?.homeLabel ? `Home location: ${preferences.homeLabel}` : ""}

## Peer Schools for Comparison
${peerContext || "  No peer data available"}

## Instructions
- Be specific and honest. Reference actual numbers.
- Don't give generic praise. Every school has trade-offs.
- If program-level earnings data is available for their interests, highlight it specifically.
- Compare to peer schools where relevant.
- The verdict should reflect realistic fit, not optimism.

Respond with valid JSON matching this exact schema:
{
  "verdict": "strong_fit" | "good_fit" | "decent_fit" | "uncertain" | "weak_fit",
  "oneLiner": "One sentence summarizing what makes this school notable (include a key number)",
  "fitAnalysis": "2-3 sentences on why this school fits or doesn't fit based on family priorities",
  "programInsight": "What studying their interests here means for earnings and debt, using program-level data",
  "costReality": "Net price + debt + earnings = honest ROI picture in 2-3 sentences",
  "strengths": ["3-4 specific bullet points"],
  "risks": ["2-3 specific bullet points"],
  "bottomLine": "One sentence: Worth applying if..."
}`;
}

export async function generateCollegeBriefing(
  slug: string,
  preferences: FamilyPreferences | null
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: "ANTHROPIC_API_KEY is not configured" };
  }

  // Rate limit check
  const today = new Date().toISOString().slice(0, 10);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collegeBriefings)
    .where(sql`${schema.collegeBriefings.generatedAt} LIKE ${today + "%"}`);

  const todayCount = countResult[0]?.count ?? 0;
  if (todayCount >= DAILY_LIMIT) {
    return { success: false, error: "Daily briefing limit reached (20/day)" };
  }

  const colleges = await readColleges();
  const college = colleges.find((c) => c.slug === slug);
  if (!college) {
    return { success: false, error: "College not found" };
  }

  // Pick peer schools (similar rank range)
  const peerColleges = colleges
    .filter((c) => c.slug !== slug)
    .sort((a, b) => Math.abs(a.rank - college.rank) - Math.abs(b.rank - college.rank))
    .slice(0, 4);

  const prompt = buildPrompt(college, preferences, peerColleges);

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Extract JSON from response
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      return { success: false, error: "AI response did not contain valid JSON" };
    }

    const jsonStr = text.slice(firstBrace, lastBrace + 1);
    const briefingData = JSON.parse(jsonStr) as CollegeBriefingData;

    // Validate required fields
    if (!briefingData.verdict || !briefingData.oneLiner) {
      return { success: false, error: "AI response missing required fields" };
    }

    // Delete existing briefing for this slug
    await db
      .delete(schema.collegeBriefings)
      .where(eq(schema.collegeBriefings.slug, slug));

    // Insert new briefing
    await db.insert(schema.collegeBriefings).values({
      id: uuidv4(),
      slug,
      briefingData: JSON.stringify(briefingData),
      model: MODEL,
      generatedAt: new Date().toISOString(),
    });

    revalidatePath(`/colleges/${slug}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
