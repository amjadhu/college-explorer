"use client";

import Link from "next/link";
import type { CollegeRecord } from "@/lib/types";
import type { FamilyScore } from "@/lib/scoring";
import { formatMoney, formatPercent } from "@/lib/format";
import type { CollegeBriefingData } from "@/app/actions/briefing";

type Props = {
  college: CollegeRecord;
  familyScore: FamilyScore;
  onSave: (slug: string) => void;
  isSaved: boolean;
  briefing?: CollegeBriefingData | null;
  interests?: string[];
};

const verdictColors: Record<string, string> = {
  strong_fit: "var(--ok)",
  good_fit: "#2a8f7a",
  decent_fit: "var(--brand)",
  uncertain: "var(--muted)",
  weak_fit: "var(--warn)",
};

const verdictLabels: Record<string, string> = {
  strong_fit: "Strong Fit",
  good_fit: "Good Fit",
  decent_fit: "Decent Fit",
  uncertain: "Uncertain",
  weak_fit: "Weak Fit",
};

export default function MatchCard({ college, familyScore, onSave, isSaved, briefing, interests }: Props) {
  // Find a program match if interests are set
  const interestSet = new Set(interests ?? []);
  const matchedProgram = college.allMajors.find(
    (m) => interestSet.has(m.key) && m.medianEarnings != null
  );

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

      {briefing && (
        <div className="match-verdict">
          <span
            className="verdict-badge-sm"
            style={{ background: verdictColors[briefing.verdict] ?? "var(--muted)" }}
          >
            {verdictLabels[briefing.verdict] ?? briefing.verdict}
          </span>
          <span className="verdict-text">{briefing.oneLiner}</span>
        </div>
      )}

      <div className="match-key-numbers">
        <div className="match-stat">
          <b>Net Price/yr</b>
          <span>{formatMoney(college.avgNetPrice ?? college.costOfAttendance)}</span>
        </div>
        <div className="match-stat">
          <b>Earnings (10y)</b>
          <span>{formatMoney(college.medianEarnings10y)}</span>
        </div>
        <div className="match-stat">
          <b>Median Debt</b>
          <span>{formatMoney(college.medianDebt)}</span>
        </div>
      </div>

      {matchedProgram && (
        <div className="match-program">
          <span className="match-program-label">{matchedProgram.label}:</span>
          <span className="match-program-earnings">
            {formatMoney(matchedProgram.medianEarnings)} median earnings
          </span>
        </div>
      )}

      <div className="match-card-actions">
        <Link href={`/colleges/${college.slug}`} className="ghost">
          View Details
        </Link>
      </div>
    </article>
  );
}
