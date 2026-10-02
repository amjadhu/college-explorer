"use client";

import { useTransition, useState, useEffect } from "react";
import { generateCollegeBriefing } from "@/app/actions/briefing";
import type { CollegeBriefingData } from "@/app/actions/briefing";
import type { FamilyPreferences } from "@/lib/types";
import { readPreferences } from "@/lib/preferences-storage";

type Props = {
  slug: string;
  initialBriefing: {
    briefingData: CollegeBriefingData;
    generatedAt: string;
    model: string;
  } | null;
  initialRemaining: number;
};

const verdictColors: Record<CollegeBriefingData["verdict"], string> = {
  strong_fit: "var(--ok)",
  good_fit: "#2a8f7a",
  decent_fit: "var(--brand)",
  uncertain: "var(--muted)",
  weak_fit: "var(--warn)",
};

const verdictLabels: Record<CollegeBriefingData["verdict"], string> = {
  strong_fit: "Strong Fit",
  good_fit: "Good Fit",
  decent_fit: "Decent Fit",
  uncertain: "Uncertain",
  weak_fit: "Weak Fit",
};

export default function CollegeBriefing({ slug, initialBriefing, initialRemaining }: Props) {
  const [isPending, startTransition] = useTransition();
  const [briefing, setBriefing] = useState(initialBriefing);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<FamilyPreferences | null>(null);

  useEffect(() => {
    const prefs = readPreferences(window.localStorage);
    setPreferences(prefs);
  }, []);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateCollegeBriefing(slug, preferences);
      if (result.success) {
        setRemaining((r) => Math.max(0, r - 1));
        // Reload the page to get fresh data from server
        window.location.reload();
      } else {
        setError(result.error ?? "Failed to generate briefing");
      }
    });
  };

  const data = briefing?.briefingData;

  return (
    <div className="ai-briefing">
      <div className="ai-briefing-header">
        <div>
          <h2>AI Briefing</h2>
          <p className="meta">
            {data
              ? `Generated ${new Date(briefing!.generatedAt).toLocaleDateString()} · ${briefing!.model}`
              : "Get an AI-powered analysis of this school"}
          </p>
        </div>
        <div className="ai-briefing-actions">
          <span className="meta">{remaining}/20 remaining today</span>
          <button
            type="button"
            className="prefs-save-btn"
            onClick={handleGenerate}
            disabled={isPending || remaining === 0}
          >
            {isPending ? "Generating..." : data ? "Refresh" : "Generate Briefing"}
          </button>
        </div>
      </div>

      {error && <p className="ai-error">{error}</p>}

      {data && (
        <div className="ai-briefing-body">
          <div className="ai-verdict-row">
            <span
              className="ai-verdict-badge"
              style={{ background: verdictColors[data.verdict] }}
            >
              {verdictLabels[data.verdict]}
            </span>
            <p className="ai-oneliner">{data.oneLiner}</p>
          </div>

          <div className="ai-section">
            <h3>Fit Analysis</h3>
            <p>{data.fitAnalysis}</p>
          </div>

          <div className="ai-section">
            <h3>Program Insight</h3>
            <p>{data.programInsight}</p>
          </div>

          <div className="ai-section">
            <h3>Cost Reality</h3>
            <p>{data.costReality}</p>
          </div>

          <div className="ai-columns">
            <div className="ai-section">
              <h3>Strengths</h3>
              <ul>
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="ai-section">
              <h3>Risks</h3>
              <ul className="ai-risks">
                {data.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ai-bottom-line">
            <strong>Bottom Line:</strong> {data.bottomLine}
          </div>
        </div>
      )}
    </div>
  );
}
