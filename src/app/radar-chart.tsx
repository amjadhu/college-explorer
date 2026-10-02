"use client";

import type { DimensionKey } from "@/lib/types";
import { dimensionLabels } from "@/lib/scoring";
import type { FamilyScore } from "@/lib/scoring";

type Props = {
  scores: FamilyScore;
  label?: string;
  size?: number;
  color?: string;
};

const dimensions = Object.keys(dimensionLabels) as DimensionKey[];
const shortLabels: Record<DimensionKey, string> = {
  academicRigor: "Academic",
  careerOutcomes: "Career",
  financialValue: "Value",
  safetyWellbeing: "Safety",
  campusLifeCulture: "Culture",
  locationEnvironment: "Location",
  programStrength: "Programs",
};

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export default function RadarChart({ scores, label, size = 240, color = "#1c5560" }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // start at top

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Build the data polygon
  const points = dimensions.map((key, i) => {
    const dim = scores.dimensions.find((d) => d.key === key);
    const value = (dim?.score ?? 0) / 100;
    const angle = startAngle + i * angleStep;
    return polarToCartesian(cx, cy, maxR * value, angle);
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <div className="radar-chart">
      <div>
        <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size }}>
          {/* Grid rings */}
          {rings.map((r) => (
            <polygon
              key={r}
              points={dimensions.map((_, i) => {
                const angle = startAngle + i * angleStep;
                const pt = polarToCartesian(cx, cy, maxR * r, angle);
                return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
              }).join(" ")}
              fill="none"
              stroke="#ddd3c5"
              strokeWidth={r === 1 ? 1.5 : 0.8}
            />
          ))}

          {/* Axis lines */}
          {dimensions.map((_, i) => {
            const angle = startAngle + i * angleStep;
            const end = polarToCartesian(cx, cy, maxR, angle);
            return (
              <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#ddd3c5" strokeWidth={0.8} />
            );
          })}

          {/* Data polygon */}
          <path d={polygonPath} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} />

          {/* Data dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
          ))}

          {/* Labels */}
          {dimensions.map((key, i) => {
            const angle = startAngle + i * angleStep;
            const labelR = maxR + 18;
            const pt = polarToCartesian(cx, cy, labelR, angle);
            const dim = scores.dimensions.find((d) => d.key === key);
            return (
              <text
                key={key}
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="#5c6476"
                fontWeight={600}
              >
                {shortLabels[key]} {dim?.score ?? 0}
              </text>
            );
          })}
        </svg>
        {label && (
          <p style={{ textAlign: "center", fontSize: "0.82rem", fontWeight: 700, margin: "0.2rem 0 0", color: "#1c5560" }}>
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
