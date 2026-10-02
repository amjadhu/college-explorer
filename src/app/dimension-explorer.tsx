"use client";

import { useState } from "react";
import Link from "next/link";
import type { CollegeRecord, DimensionKey } from "@/lib/types";
import type { FamilyScore } from "@/lib/scoring";
import { dimensionLabels } from "@/lib/scoring";

type RankedCollege = {
  college: CollegeRecord;
  familyScore: FamilyScore;
};

type Props = {
  ranked: RankedCollege[];
};

export default function DimensionExplorer({ ranked }: Props) {
  const [activeDim, setActiveDim] = useState<DimensionKey>("academicRigor");

  const sorted = [...ranked].sort((a, b) => {
    const dimA = a.familyScore.dimensions.find((d) => d.key === activeDim);
    const dimB = b.familyScore.dimensions.find((d) => d.key === activeDim);
    return (dimB?.score ?? 0) - (dimA?.score ?? 0);
  });

  const top5 = sorted.slice(0, 5);

  return (
    <section className="dim-explorer">
      <h3>Explore by Dimension</h3>
      <p className="meta">See which schools excel in each area</p>

      <div className="dim-tabs">
        {(Object.keys(dimensionLabels) as DimensionKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`dim-tab ${activeDim === key ? "active" : ""}`}
            onClick={() => setActiveDim(key)}
          >
            {dimensionLabels[key]}
          </button>
        ))}
      </div>

      <div className="dim-results">
        {top5.map((item, index) => {
          const dim = item.familyScore.dimensions.find((d) => d.key === activeDim);
          const score = dim?.score ?? 0;

          return (
            <div key={item.college.slug} className="dim-result-row">
              <span className="dim-rank">{index + 1}</span>
              <div className="dim-result-info">
                <Link href={`/colleges/${item.college.slug}`}>
                  <strong>{item.college.displayName}</strong>
                </Link>
                <div className="dim-bar">
                  <div className="dim-bar-fill" style={{ width: `${score}%` }} />
                </div>
              </div>
              <span className="dim-score">{score}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
