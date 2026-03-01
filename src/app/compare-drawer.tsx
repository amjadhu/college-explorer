"use client";

import type { CollegeRecord } from "@/lib/types";
import { compareHighlights, compareMetrics } from "@/lib/compare";
import { formatMoney, formatPercent } from "@/lib/format";

type Props = {
  open: boolean;
  colleges: CollegeRecord[];
  onClose: () => void;
};

const formatValue = (kind: "money" | "percent" | "count" | "text", value: number | string | null) => {
  if (value == null) return "N/A";
  if (typeof value === "string") return value;
  if (kind === "money") return formatMoney(value);
  if (kind === "percent") return formatPercent(value);
  return value.toLocaleString();
};

export default function CompareDrawer({ open, colleges, onClose }: Props) {
  if (!open) return null;

  return (
    <section className="compare-drawer" aria-label="Compare colleges">
      <div className="compare-backdrop" onClick={onClose} />

      <div className="compare-panel" role="dialog" aria-modal="true" aria-label="College comparison">
        <div className="compare-header">
          <h2>Compare Shortlisted Colleges</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                {colleges.map((college) => (
                  <th key={college.slug}>
                    <span className="badge">#{college.rank}</span>
                    <p>{college.displayName}</p>
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
      </div>
    </section>
  );
}
