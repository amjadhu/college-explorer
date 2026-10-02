"use client";

import type { StatInterpretation } from "@/lib/narrative";

type Props = {
  stat: StatInterpretation;
};

export default function StatWithContext({ stat }: Props) {
  return (
    <div className="stat-context">
      <div className="stat-context-top">
        <span className="stat-context-label">{stat.label}</span>
        <span className="stat-context-value">{stat.value}</span>
      </div>
      <div className="stat-context-band">{stat.bandLabel}</div>
      <p className="stat-context-desc">{stat.context}</p>
      {stat.percentile != null && (
        <div className="stat-pctl-bar">
          <div className="stat-pctl-fill" style={{ width: `${Math.max(2, stat.percentile)}%` }} />
        </div>
      )}
    </div>
  );
}
