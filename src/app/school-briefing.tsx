"use client";

import { useEffect, useMemo, useState } from "react";
import StatWithContext from "@/app/stat-with-context";
import RadarChart from "@/app/radar-chart";
import PeerComparison from "@/app/peer-comparison";
import type { CollegeRecord, FamilyPreferences } from "@/lib/types";
import { readPreferences } from "@/lib/preferences-storage";
import { computeFamilyScore, buildScoringContext } from "@/lib/scoring";
import { interpretAllStats } from "@/lib/narrative";
import { generateStrengths, generateConcerns } from "@/lib/narrative";
import type { FamilyScore } from "@/lib/scoring";

type Props = {
  college: CollegeRecord;
  allColleges: CollegeRecord[];
};

export default function SchoolBriefing({ college, allColleges }: Props) {
  const [preferences, setPreferences] = useState<FamilyPreferences | null>(null);

  useEffect(() => {
    const prefs = readPreferences(window.localStorage);
    setPreferences(prefs);
  }, []);

  const scoringContext = useMemo(() => buildScoringContext(allColleges), [allColleges]);

  const familyScore: FamilyScore | null = useMemo(() => {
    if (!preferences) return null;
    return computeFamilyScore(college, preferences, scoringContext);
  }, [college, preferences, scoringContext]);

  const stats = useMemo(() => interpretAllStats(college, allColleges), [college, allColleges]);

  const strengths = useMemo(() => {
    if (!preferences || !familyScore) return [];
    return generateStrengths(college, familyScore, preferences, allColleges);
  }, [college, familyScore, preferences, allColleges]);

  const concerns = useMemo(() => {
    if (!preferences || !familyScore) return [];
    return generateConcerns(college, familyScore, preferences, allColleges);
  }, [college, familyScore, preferences, allColleges]);

  const hasCustomPrefs = preferences && (
    Object.values(preferences.weights).some((w) => w !== 50) || preferences.interests.length > 0
  );

  return (
    <>
      {familyScore && hasCustomPrefs && (
        <>
          <div className="narrative-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ marginBottom: 0 }}>
                  Family Score: <span style={{ color: "var(--brand)", fontSize: "1.5rem" }}>{familyScore.total}/100</span>
                </h2>
                <p className="meta">Based on your family&apos;s preferences</p>
              </div>
            </div>
            <RadarChart scores={familyScore} label={college.displayName} />
          </div>

          {strengths.length > 0 && (
            <div className="narrative-section">
              <h2>Why This Could Be a Great Fit</h2>
              <div className="narrative-points">
                {strengths.map((point, i) => (
                  <div key={i} className="narrative-point">
                    <strong>{point.headline}</strong>
                    <p>{point.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {concerns.length > 0 && (
            <div className="narrative-section">
              <h2>What to Watch Out For</h2>
              <div className="narrative-points">
                {concerns.map((point, i) => (
                  <div key={i} className="narrative-point concern">
                    <strong>{point.headline}</strong>
                    <p>{point.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!hasCustomPrefs && (
        <div className="narrative-section">
          <h2>Personalize This View</h2>
          <p className="meta">
            Set your family&apos;s priorities on the <a href="/">home page</a> to see a personalized Family Score, strengths, and concerns for this school.
          </p>
        </div>
      )}

      <div className="narrative-section">
        <h2>Key Stats in Context</h2>
        <div className="detail-grid">
          {stats.map((stat) => (
            <StatWithContext key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      <PeerComparison college={college} allColleges={allColleges} />
    </>
  );
}
