"use client";

import Link from "next/link";
import type { CollegeRecord } from "@/lib/types";
import type { FamilyScore } from "@/lib/scoring";
import { formatMoney } from "@/lib/format";

type RankedCollege = {
  college: CollegeRecord;
  familyScore: FamilyScore;
};

type Props = {
  ranked: RankedCollege[];
  interests: string[];
};

type InsightCard = {
  title: string;
  schoolName: string;
  slug: string;
  detail: string;
};

export default function InsightStrip({ ranked, interests }: Props) {
  const insights: InsightCard[] = [];

  // Best Value: highest earnings / lowest net price ratio
  const withValue = ranked
    .filter((r) => r.college.medianEarnings10y != null && r.college.avgNetPrice != null && r.college.avgNetPrice > 0)
    .sort((a, b) => {
      const ratioA = (a.college.medianEarnings10y ?? 0) / (a.college.avgNetPrice ?? 1);
      const ratioB = (b.college.medianEarnings10y ?? 0) / (b.college.avgNetPrice ?? 1);
      return ratioB - ratioA;
    });

  if (withValue.length > 0) {
    const best = withValue[0];
    insights.push({
      title: "Best Value",
      schoolName: best.college.displayName,
      slug: best.college.slug,
      detail: `${formatMoney(best.college.medianEarnings10y)} earnings / ${formatMoney(best.college.avgNetPrice)} net price`,
    });
  }

  // Strongest in interests
  if (interests.length > 0) {
    const interestSet = new Set(interests);
    const withMatch = ranked
      .map((r) => {
        const matchShare = r.college.allMajors
          .filter((m) => interestSet.has(m.key))
          .reduce((sum, m) => sum + m.share, 0);
        return { ...r, matchShare };
      })
      .filter((r) => r.matchShare > 0)
      .sort((a, b) => b.matchShare - a.matchShare);

    if (withMatch.length > 0) {
      const best = withMatch[0];
      const matchNames = best.college.allMajors
        .filter((m) => interestSet.has(m.key))
        .slice(0, 2)
        .map((m) => m.label)
        .join(", ");
      insights.push({
        title: "Strongest in Your Interests",
        schoolName: best.college.displayName,
        slug: best.college.slug,
        detail: matchNames,
      });
    }
  }

  // Hidden Gem: high family score + higher admission rate (more accessible)
  const gems = ranked
    .filter((r) => r.college.admissionRate != null && r.college.admissionRate > 0.2)
    .sort((a, b) => b.familyScore.total - a.familyScore.total);

  if (gems.length > 0) {
    const gem = gems[0];
    insights.push({
      title: "Hidden Gem",
      schoolName: gem.college.displayName,
      slug: gem.college.slug,
      detail: `Family Score ${gem.familyScore.total} with ${((gem.college.admissionRate ?? 0) * 100).toFixed(0)}% acceptance`,
    });
  }

  // Highest Family Score overall
  if (ranked.length > 0) {
    insights.push({
      title: "Top Match",
      schoolName: ranked[0].college.displayName,
      slug: ranked[0].college.slug,
      detail: `Family Score: ${ranked[0].familyScore.total}/100`,
    });
  }

  if (insights.length === 0) return null;

  return (
    <section className="insight-strip" aria-label="Quick insights">
      {insights.slice(0, 4).map((insight) => (
        <Link href={`/colleges/${insight.slug}`} key={insight.title} className="insight-card">
          <span className="insight-title">{insight.title}</span>
          <strong className="insight-school">{insight.schoolName}</strong>
          <span className="insight-detail">{insight.detail}</span>
        </Link>
      ))}
    </section>
  );
}
