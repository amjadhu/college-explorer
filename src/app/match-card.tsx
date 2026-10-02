"use client";

import Link from "next/link";
import type { CollegeRecord } from "@/lib/types";
import type { FamilyScore } from "@/lib/scoring";
import { dimensionLabels } from "@/lib/scoring";
import { formatMoney, formatPercent } from "@/lib/format";

type Props = {
  college: CollegeRecord;
  familyScore: FamilyScore;
  onSave: (slug: string) => void;
  isSaved: boolean;
};

export default function MatchCard({ college, familyScore, onSave, isSaved }: Props) {
  // Top 3 scoring dimensions
  const topDimensions = [...familyScore.dimensions]
    .filter((d) => d.available)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <article className="match-card">
      <div className="match-card-top">
        <div className="match-card-score">
          <span className="match-score-value">{familyScore.total}</span>
          <span className="match-score-label">Family Score</span>
        </div>
        <div className="match-card-info">
          <span className="badge">#{college.rank}</span>
          <button type="button" className="save-btn" onClick={() => onSave(college.slug)}>
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <h3>
        <Link href={`/colleges/${college.slug}`}>{college.displayName}</Link>
      </h3>

      <p className="meta">
        {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"}
        {college.ownership === 1 ? " · Public" : college.ownership != null ? " · Private" : ""}
      </p>

      <div className="match-dimensions">
        {topDimensions.map((dim) => (
          <div key={dim.key} className="match-dim">
            <div className="match-dim-bar">
              <div className="match-dim-fill" style={{ width: `${dim.score}%` }} />
            </div>
            <span className="match-dim-label">{dimensionLabels[dim.key]}</span>
            <span className="match-dim-score">{dim.score}</span>
          </div>
        ))}
      </div>

      <div className="match-stats">
        <div className="match-stat">
          <b>Acceptance</b>
          <span>{formatPercent(college.admissionRate)}</span>
        </div>
        <div className="match-stat">
          <b>Net Price</b>
          <span>{formatMoney(college.avgNetPrice ?? college.costOfAttendance)}</span>
        </div>
        <div className="match-stat">
          <b>Earnings (10y)</b>
          <span>{formatMoney(college.medianEarnings10y)}</span>
        </div>
      </div>
    </article>
  );
}
