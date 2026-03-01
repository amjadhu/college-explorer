"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollegeRecord } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

const CollegeMapCanvas = dynamic(() => import("@/app/college-map-canvas"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>
});

type Props = {
  colleges: CollegeRecord[];
  shortlistSlugs: string[];
};

const markerColors = {
  city: "#d1495b",
  suburb: "#edae49",
  town: "#00798c",
  rural: "#3066be",
  unknown: "#8d99ae"
} as const;

export default function CollegeMapPanel({ colleges, shortlistSlugs }: Props) {
  const mapItems = useMemo(() => {
    return colleges
      .filter((college) => typeof college.latitude === "number" && typeof college.longitude === "number")
      .map((college) => ({
        slug: college.slug,
        rank: college.rank,
        name: college.displayName,
        city: college.city,
        state: college.state,
        latitude: college.latitude as number,
        longitude: college.longitude as number,
        costOfAttendance: college.costOfAttendance,
        admissionRate: college.admissionRate,
        medianEarnings10y: college.medianEarnings10y,
        settingLabel: college.settingLabel,
        markerColor: markerColors[college.settingBucket]
      }));
  }, [colleges]);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(mapItems[0]?.slug ?? null);
  const selected = mapItems.find((item) => item.slug === selectedSlug) ?? null;

  if (!mapItems.length) {
    return (
      <section className="map-shell">
        <h2>College Map</h2>
        <p className="meta">Map data is unavailable until coordinates are present in the dataset.</p>
      </section>
    );
  }

  return (
    <section className="map-shell" aria-label="College map">
      <div className="map-header">
        <h2>Map Lens</h2>
        <p className="meta">Urban and rural settings are color coded. Click markers or names for details.</p>
      </div>

      <div className="map-layout">
        <aside className="map-list" aria-label="College names">
          {mapItems.map((item) => {
            const active = item.slug === selectedSlug;
            const shortlisted = shortlistSlugs.includes(item.slug);
            return (
              <button
                key={item.slug}
                className={`map-list-item ${active ? "active" : ""} ${shortlisted ? "shortlisted" : ""}`}
                onClick={() => setSelectedSlug(item.slug)}
                type="button"
              >
                <span>#{item.rank}</span>
                <strong>{item.name}</strong>
              </button>
            );
          })}
        </aside>

        <div className="map-stage">
          <CollegeMapCanvas
            items={mapItems}
            selectedSlug={selectedSlug}
            shortlistSlugs={shortlistSlugs}
            onSelect={setSelectedSlug}
          />

          {selected && (
            <article className="map-info-card" role="dialog" aria-label="Selected college info">
              <button className="map-dismiss" onClick={() => setSelectedSlug(null)} type="button">
                Dismiss
              </button>
              <h3>
                #{selected.rank} {selected.name}
              </h3>
              <p className="meta">
                {selected.city && selected.state ? `${selected.city}, ${selected.state}` : "Location unavailable"} · {selected.settingLabel}
              </p>
              <div className="map-info-grid">
                <div className="stat">
                  <b>Acceptance</b>
                  <span>{formatPercent(selected.admissionRate)}</span>
                </div>
                <div className="stat">
                  <b>Cost of Attendance</b>
                  <span>{formatMoney(selected.costOfAttendance)}</span>
                </div>
                <div className="stat">
                  <b>10y Earnings</b>
                  <span>{formatMoney(selected.medianEarnings10y)}</span>
                </div>
              </div>
              <Link href={`/colleges/${selected.slug}`} className="map-detail-link">
                Open college profile
              </Link>
            </article>
          )}
        </div>
      </div>

      <div className="map-legend" aria-label="Map legend">
        <span className="legend-label">Setting Colors:</span>
        <span className="legend-chip">
          <i style={{ background: markerColors.city }} /> City
        </span>
        <span className="legend-chip">
          <i style={{ background: markerColors.suburb }} /> Suburb
        </span>
        <span className="legend-chip">
          <i style={{ background: markerColors.town }} /> Town
        </span>
        <span className="legend-chip">
          <i style={{ background: markerColors.rural }} /> Rural
        </span>
      </div>
    </section>
  );
}
