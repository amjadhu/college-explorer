"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RadarChart from "@/app/radar-chart";
import type { CollegeRecord, FamilyPreferences } from "@/lib/types";
import { readPreferences } from "@/lib/preferences-storage";
import { readShortlist } from "@/lib/shortlist-storage";
import { computeFamilyScore, buildScoringContext } from "@/lib/scoring";
import { compareMetrics, compareHighlights, generateTradeoffs } from "@/lib/compare";
import { formatMoney, formatPercent } from "@/lib/format";

type Props = {
  allColleges: CollegeRecord[];
};

const formatValue = (kind: "money" | "percent" | "count" | "text", value: number | string | null) => {
  if (value == null) return "N/A";
  if (typeof value === "string") return value;
  if (kind === "money") return formatMoney(value);
  if (kind === "percent") return formatPercent(value);
  return value.toLocaleString();
};

const radarColors = ["#1c5560", "#c5663f", "#1f7a63", "#6b4c9a"];

export default function ComparisonView({ allColleges }: Props) {
  const [compareSlug, setCompareSlug] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<FamilyPreferences | null>(null);

  useEffect(() => {
    const shortlist = readShortlist(window.localStorage);
    setCompareSlug(shortlist.slugs.slice(0, 4));
    const prefs = readPreferences(window.localStorage);
    setPreferences(prefs);
  }, []);

  const colleges = useMemo(
    () => compareSlug
      .map((slug) => allColleges.find((c) => c.slug === slug))
      .filter((c): c is CollegeRecord => c != null),
    [compareSlug, allColleges]
  );

  const scoringContext = useMemo(() => buildScoringContext(allColleges), [allColleges]);

  const scores = useMemo(() => {
    if (!preferences) return [];
    return colleges.map((c) => ({
      college: c,
      score: computeFamilyScore(c, preferences, scoringContext),
    }));
  }, [colleges, preferences, scoringContext]);

  const hasCustomPrefs = preferences && (
    Object.values(preferences.weights).some((w) => w !== 50) || preferences.interests.length > 0
  );

  if (colleges.length < 2) {
    return (
      <div className="narrative-section">
        <h2>Compare Schools</h2>
        <p className="meta">
          Save at least 2 schools from the <Link href="/">home page</Link> to compare them side-by-side.
        </p>
      </div>
    );
  }

  // Trade-off summaries between first two colleges
  const tradeoffs = scores.length >= 2
    ? generateTradeoffs(scores[0].college, scores[1].college, scores[0].score, scores[1].score)
    : [];

  return (
    <>
      {hasCustomPrefs && scores.length > 0 && (
        <div className="compare-radars">
          {scores.map((s, i) => (
            <RadarChart
              key={s.college.slug}
              scores={s.score}
              label={`${s.college.displayName} (${s.score.total})`}
              color={radarColors[i % radarColors.length]}
              size={220}
            />
          ))}
        </div>
      )}

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              {colleges.map((c) => (
                <th key={c.slug}>
                  <span className="badge">#{c.rank}</span>
                  <p>
                    <Link href={`/colleges/${c.slug}`}>{c.displayName}</Link>
                  </p>
                  {hasCustomPrefs && scores.length > 0 && (
                    <p style={{ fontSize: "0.82rem", color: "var(--brand)", fontWeight: 700 }}>
                      Family Score: {scores.find((s) => s.college.slug === c.slug)?.score.total ?? "—"}
                    </p>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareMetrics.map((metric) => {
              const highlights = compareHighlights(colleges, metric);
              return (
                <tr key={metric.key}>
                  <th>{metric.label}</th>
                  {colleges.map((college) => {
                    const value = metric.accessor(college);
                    const isBest = highlights.best.has(college.slug);
                    const isCaution = highlights.caution.has(college.slug);
                    return (
                      <td key={college.slug}>
                        <span>{formatValue(metric.kind, value)}</span>
                        {isBest && <small className="best">Best</small>}
                        {!isBest && isCaution && <small className="caution">Caution</small>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasCustomPrefs && tradeoffs.length > 0 && (
        <section className="compare-tradeoffs">
          <h2>Trade-off Summary</h2>
          {tradeoffs.map((t) => (
            <div key={t.dimension} className="tradeoff-row">
              <strong>{t.dimension}</strong>
              <p>{t.text}</p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
