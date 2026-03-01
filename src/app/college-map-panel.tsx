"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollegeRecord, SettingBucket } from "@/lib/types";
import { formatMajorShare, formatMoney, formatPercent } from "@/lib/format";

const CollegeMapCanvas = dynamic(() => import("@/app/college-map-canvas"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>
});

type Props = {
  colleges: CollegeRecord[];
  shortlistSlugs: string[];
};

type ViewMode = "map" | "cost" | "setting" | "majors" | "value";
type ValueQuadrant = "q1" | "q2" | "q3" | "q4";

type MapItem = {
  slug: string;
  rank: number;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  costOfAttendance: number | null;
  admissionRate: number | null;
  medianEarnings10y: number | null;
  settingLabel: string;
  settingBucket: SettingBucket;
  markerColor: string;
  topMajors: CollegeRecord["topMajors"];
};

const markerColors: Record<SettingBucket, string> = {
  city: "#d1495b",
  suburb: "#edae49",
  town: "#00798c",
  rural: "#3066be",
  unknown: "#8d99ae"
};

const viewTabs: Array<{ key: ViewMode; label: string }> = [
  { key: "map", label: "Map" },
  { key: "cost", label: "Cost" },
  { key: "setting", label: "Setting" },
  { key: "majors", label: "Majors" },
  { key: "value", label: "Value" }
];

const settingOrder: SettingBucket[] = ["city", "suburb", "town", "rural", "unknown"];

export default function CollegeMapPanel({ colleges, shortlistSlugs }: Props) {
  const mapItems = useMemo<MapItem[]>(() => {
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
        settingBucket: college.settingBucket,
        markerColor: markerColors[college.settingBucket],
        topMajors: college.topMajors
      }));
  }, [colleges]);

  const [view, setView] = useState<ViewMode>("map");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeSetting, setActiveSetting] = useState<SettingBucket | null>(null);
  const [activeMajorKey, setActiveMajorKey] = useState<string | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<ValueQuadrant | null>(null);

  const selected = mapItems.find((item) => item.slug === selectedSlug) ?? null;

  const costItems = useMemo(() => {
    return mapItems
      .filter((item) => typeof item.costOfAttendance === "number")
      .sort((a, b) => (a.costOfAttendance as number) - (b.costOfAttendance as number));
  }, [mapItems]);

  const maxCost = useMemo(
    () => Math.max(...costItems.map((item) => item.costOfAttendance as number), 1),
    [costItems]
  );

  const settingStats = useMemo(() => {
    return settingOrder
      .map((setting) => {
        const schools = mapItems.filter((item) => item.settingBucket === setting);
        const avgCost =
          schools.length > 0
            ? schools.reduce((sum, item) => sum + (item.costOfAttendance ?? 0), 0) / schools.length
            : null;
        const avgEarnings =
          schools.length > 0
            ? schools.reduce((sum, item) => sum + (item.medianEarnings10y ?? 0), 0) / schools.length
            : null;

        return {
          setting,
          label: setting === "unknown" ? "Unknown" : setting[0].toUpperCase() + setting.slice(1),
          count: schools.length,
          avgCost,
          avgEarnings,
          color: markerColors[setting]
        };
      })
      .filter((row) => row.count > 0);
  }, [mapItems]);

  const settingTakeaways = useMemo(() => {
    if (!settingStats.length) {
      return {
        mostCommon: null,
        lowestCost: null,
        highestEarnings: null
      };
    }

    const mostCommon = [...settingStats].sort((a, b) => b.count - a.count)[0];
    const lowestCost = settingStats
      .filter((row) => typeof row.avgCost === "number")
      .sort((a, b) => (a.avgCost as number) - (b.avgCost as number))[0] ?? null;
    const highestEarnings = settingStats
      .filter((row) => typeof row.avgEarnings === "number")
      .sort((a, b) => (b.avgEarnings as number) - (a.avgEarnings as number))[0] ?? null;

    return { mostCommon, lowestCost, highestEarnings };
  }, [settingStats]);

  const majorStats = useMemo(() => {
    const rollup = new Map<string, { key: string; label: string; shareTotal: number; count: number }>();

    for (const item of mapItems) {
      for (const major of item.topMajors) {
        const existing = rollup.get(major.key);
        if (existing) {
          existing.shareTotal += major.share;
          existing.count += 1;
        } else {
          rollup.set(major.key, {
            key: major.key,
            label: major.label,
            shareTotal: major.share,
            count: 1
          });
        }
      }
    }

    return [...rollup.values()]
      .map((row) => ({ ...row, avgShare: row.shareTotal / row.count }))
      .sort((a, b) => b.count - a.count || b.avgShare - a.avgShare)
      .slice(0, 12);
  }, [mapItems]);

  const majorTakeaways = useMemo(() => {
    if (!majorStats.length) {
      return {
        mostCommon: null,
        highestShare: null,
        coverageSchools: 0
      };
    }

    const mostCommon = [...majorStats].sort((a, b) => b.count - a.count)[0];
    const highestShare = [...majorStats].sort((a, b) => b.avgShare - a.avgShare)[0];
    const coverageSchools = mapItems.filter((item) => item.topMajors.length > 0).length;

    return { mostCommon, highestShare, coverageSchools };
  }, [majorStats, mapItems]);

  const valueItems = useMemo(() => {
    return mapItems.filter(
      (item) => typeof item.costOfAttendance === "number" && typeof item.medianEarnings10y === "number"
    );
  }, [mapItems]);

  const valueBounds = useMemo(() => {
    const costs = valueItems.map((item) => item.costOfAttendance as number);
    const earnings = valueItems.map((item) => item.medianEarnings10y as number);

    return {
      minCost: Math.min(...costs, 0),
      maxCost: Math.max(...costs, 1),
      minEarnings: Math.min(...earnings, 0),
      maxEarnings: Math.max(...earnings, 1)
    };
  }, [valueItems]);

  const valuePoints = useMemo(() => {
    return valueItems.map((item) => {
      const cost = item.costOfAttendance as number;
      const earnings = item.medianEarnings10y as number;
      const x =
        valueBounds.maxCost === valueBounds.minCost
          ? 50
          : ((cost - valueBounds.minCost) / (valueBounds.maxCost - valueBounds.minCost)) * 100;
      const y =
        valueBounds.maxEarnings === valueBounds.minEarnings
          ? 50
          : ((earnings - valueBounds.minEarnings) / (valueBounds.maxEarnings - valueBounds.minEarnings)) * 100;
      const valueScore = (1 - x / 100) * 0.5 + (y / 100) * 0.5;
      const quadrant: ValueQuadrant = x <= 50 ? (y >= 50 ? "q1" : "q3") : y >= 50 ? "q2" : "q4";

      return { ...item, x, y, valueScore, quadrant };
    });
  }, [valueBounds.maxCost, valueBounds.maxEarnings, valueBounds.minCost, valueBounds.minEarnings, valueItems]);

  const rankedValuePoints = useMemo(
    () => [...valuePoints].sort((a, b) => b.valueScore - a.valueScore || a.rank - b.rank),
    [valuePoints]
  );

  const quadrantCounts = useMemo(() => {
    return {
      q1: valuePoints.filter((point) => point.quadrant === "q1").length,
      q2: valuePoints.filter((point) => point.quadrant === "q2").length,
      q3: valuePoints.filter((point) => point.quadrant === "q3").length,
      q4: valuePoints.filter((point) => point.quadrant === "q4").length
    };
  }, [valuePoints]);

  const settingFiltered = useMemo(
    () => (activeSetting ? mapItems.filter((item) => item.settingBucket === activeSetting) : []),
    [activeSetting, mapItems]
  );

  const majorFiltered = useMemo(() => {
    if (!activeMajorKey) return [];

    return mapItems
      .filter((item) => item.topMajors.some((major) => major.key === activeMajorKey))
      .map((item) => ({
        ...item,
        majorShare: item.topMajors.find((major) => major.key === activeMajorKey)?.share ?? null
      }))
      .sort((a, b) => (b.majorShare ?? 0) - (a.majorShare ?? 0));
  }, [activeMajorKey, mapItems]);

  const valueFiltered = useMemo(
    () => (activeQuadrant ? rankedValuePoints.filter((point) => point.quadrant === activeQuadrant) : []),
    [activeQuadrant, rankedValuePoints]
  );

  const activeMajorLabel = useMemo(
    () => majorStats.find((major) => major.key === activeMajorKey)?.label ?? null,
    [activeMajorKey, majorStats]
  );

  if (!mapItems.length) {
    return (
      <section className="map-shell">
        <h2>Data Visualizer</h2>
        <p className="meta">Visualization data is unavailable until coordinates and metrics are present.</p>
      </section>
    );
  }

  return (
    <section className="map-shell" aria-label="College data visualizer">
      <div className="map-header">
        <h2>Data Visualizer</h2>
        <p className="meta">Switch views to explore geography, cost, setting mix, majors, and value tradeoffs.</p>
      </div>

      <div className="viz-tabs" role="tablist" aria-label="Visualization types">
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={view === tab.key ? "active" : ""}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "map" && (
        <>
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
        </>
      )}

      {view === "cost" && (
        <div className="viz-card">
          <h3>Cost Distribution</h3>
          <p className="meta">Lower bars are lower annual cost of attendance.</p>
          <div className="cost-bars">
            {costItems.map((item) => (
              <button key={item.slug} type="button" className="cost-row" onClick={() => setSelectedSlug(item.slug)}>
                <span className="cost-name">#{item.rank} {item.name}</span>
                <div className="cost-track">
                  <i style={{ width: `${(((item.costOfAttendance as number) / maxCost) * 100).toFixed(2)}%` }} />
                </div>
                <span className="cost-value">{formatMoney(item.costOfAttendance)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "setting" && (
        <div className="viz-card">
          <h3>Setting Mix</h3>
          <p className="meta">Visual breakdown of where schools are located, and how cost/outcomes shift by setting.</p>

          <div className="setting-takeaways">
            {settingTakeaways.mostCommon && (
              <article className="takeaway-card">
                <b>Most common setting</b>
                <span>
                  {settingTakeaways.mostCommon.label} ({settingTakeaways.mostCommon.count} schools)
                </span>
              </article>
            )}
            {settingTakeaways.lowestCost && (
              <article className="takeaway-card">
                <b>Lowest average cost</b>
                <span>
                  {settingTakeaways.lowestCost.label} ({formatMoney(Math.round(settingTakeaways.lowestCost.avgCost as number))})
                </span>
              </article>
            )}
            {settingTakeaways.highestEarnings && (
              <article className="takeaway-card">
                <b>Highest average 10y earnings</b>
                <span>
                  {settingTakeaways.highestEarnings.label} ({formatMoney(Math.round(settingTakeaways.highestEarnings.avgEarnings as number))})
                </span>
              </article>
            )}
          </div>

          <div className="setting-bars">
            {settingStats.map((row) => (
              <button
                key={row.setting}
                type="button"
                className={`setting-bar-row ${activeSetting === row.setting ? "active" : ""}`}
                onClick={() => setActiveSetting((current) => (current === row.setting ? null : row.setting))}
              >
                <div className="setting-top">
                  <span className="dot" style={{ background: row.color }} />
                  <strong>{row.label}</strong>
                  <b>{row.count} schools</b>
                </div>
                <div className="setting-track">
                  <i style={{ width: `${((row.count / Math.max(mapItems.length, 1)) * 100).toFixed(2)}%`, background: row.color }} />
                </div>
                <div className="setting-metrics">
                  <span>Avg cost {formatMoney(row.avgCost ? Math.round(row.avgCost) : null)}</span>
                  <span>Avg earnings {formatMoney(row.avgEarnings ? Math.round(row.avgEarnings) : null)}</span>
                </div>
              </button>
            ))}
          </div>

          {activeSetting && (
            <div className="viz-filter-panel">
              <div className="viz-filter-header">
                <h4>Colleges in {activeSetting === "unknown" ? "Unknown" : activeSetting}</h4>
                <button type="button" className="ghost" onClick={() => setActiveSetting(null)}>
                  Clear
                </button>
              </div>
              <div className="viz-college-list">
                {settingFiltered.map((item) => (
                  <button key={item.slug} type="button" onClick={() => setSelectedSlug(item.slug)}>
                    <span>#{item.rank}</span>
                    <b>{item.name}</b>
                    <small>{item.city && item.state ? `${item.city}, ${item.state}` : "Location unavailable"}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "majors" && (
        <div className="viz-card">
          <h3>Areas of Focus</h3>
          <p className="meta">Major strengths visualized by prevalence and average intensity.</p>

          <div className="setting-takeaways">
            {majorTakeaways.mostCommon && (
              <article className="takeaway-card">
                <b>Most prevalent</b>
                <span>
                  {majorTakeaways.mostCommon.label} ({majorTakeaways.mostCommon.count} schools)
                </span>
              </article>
            )}
            {majorTakeaways.highestShare && (
              <article className="takeaway-card">
                <b>Highest average intensity</b>
                <span>
                  {majorTakeaways.highestShare.label} ({formatMajorShare(majorTakeaways.highestShare.avgShare)})
                </span>
              </article>
            )}
            <article className="takeaway-card">
              <b>Schools with major data</b>
              <span>{majorTakeaways.coverageSchools} of {mapItems.length}</span>
            </article>
          </div>

          <div className="major-bars">
            {majorStats.map((major) => (
              <button
                key={major.key}
                type="button"
                className={`major-bar-row ${activeMajorKey === major.key ? "active" : ""}`}
                onClick={() => setActiveMajorKey((current) => (current === major.key ? null : major.key))}
              >
                <div className="major-label-row">
                  <strong>{major.label}</strong>
                  <span>{major.count} schools</span>
                </div>
                <div className="major-track">
                  <i style={{ width: `${((major.count / Math.max(mapItems.length, 1)) * 100).toFixed(2)}%` }} />
                </div>
                <p className="meta">Avg share {formatMajorShare(major.avgShare)}</p>
              </button>
            ))}
          </div>

          {activeMajorKey && (
            <div className="viz-filter-panel">
              <div className="viz-filter-header">
                <h4>Colleges strong in {activeMajorLabel ?? "selected major"}</h4>
                <button type="button" className="ghost" onClick={() => setActiveMajorKey(null)}>
                  Clear
                </button>
              </div>
              <div className="viz-college-list">
                {majorFiltered.map((item) => (
                  <button key={item.slug} type="button" onClick={() => setSelectedSlug(item.slug)}>
                    <span>#{item.rank}</span>
                    <b>{item.name}</b>
                    <small>
                      {item.majorShare != null ? `Major share ${formatMajorShare(item.majorShare)}` : "Major share unavailable"}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "value" && (
        <div className="viz-card">
          <h3>Value Scatter: Cost vs Earnings</h3>
          <p className="meta">X-axis is annual cost of attendance. Y-axis is median earnings 10 years after entry.</p>

          <div className="value-layout">
            <div className="value-chart">
              <div className="value-plot-with-y">
                <div className="value-y-axis">
                  <span className="value-y-max">Higher earnings: {formatMoney(Math.round(valueBounds.maxEarnings))}</span>
                  <span className="value-y-title">10y earnings</span>
                  <span className="value-y-min">Lower earnings: {formatMoney(Math.round(valueBounds.minEarnings))}</span>
                </div>

                <div className="value-plot">
                  <div className="plot-midline-x" />
                  <div className="plot-midline-y" />
                  <button
                    type="button"
                    className={`plot-quadrant q1 ${activeQuadrant === "q1" ? "active" : ""}`}
                    onClick={() => setActiveQuadrant((current) => (current === "q1" ? null : "q1"))}
                  >
                    High earnings, low cost ({quadrantCounts.q1})
                  </button>
                  <button
                    type="button"
                    className={`plot-quadrant q2 ${activeQuadrant === "q2" ? "active" : ""}`}
                    onClick={() => setActiveQuadrant((current) => (current === "q2" ? null : "q2"))}
                  >
                    High earnings, high cost ({quadrantCounts.q2})
                  </button>
                  <button
                    type="button"
                    className={`plot-quadrant q3 ${activeQuadrant === "q3" ? "active" : ""}`}
                    onClick={() => setActiveQuadrant((current) => (current === "q3" ? null : "q3"))}
                  >
                    Lower earnings, low cost ({quadrantCounts.q3})
                  </button>
                  <button
                    type="button"
                    className={`plot-quadrant q4 ${activeQuadrant === "q4" ? "active" : ""}`}
                    onClick={() => setActiveQuadrant((current) => (current === "q4" ? null : "q4"))}
                  >
                    Lower earnings, high cost ({quadrantCounts.q4})
                  </button>
                  {valuePoints.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      className={`plot-dot ${selectedSlug === item.slug ? "active" : ""}`}
                      style={{
                        left: `${item.x}%`,
                        bottom: `${item.y}%`,
                        background: item.markerColor,
                        opacity: activeQuadrant && item.quadrant !== activeQuadrant ? 0.18 : 1
                      }}
                      onClick={() => setSelectedSlug(item.slug)}
                      aria-label={`Select ${item.name}`}
                      title={`#${item.rank} ${item.name} | Cost ${formatMoney(item.costOfAttendance)} | Earnings ${formatMoney(item.medianEarnings10y)}`}
                    />
                  ))}
                </div>
              </div>

              <div className="value-x-scale">
                <span>Lower cost: {formatMoney(Math.round(valueBounds.minCost))}</span>
                <span>Higher cost: {formatMoney(Math.round(valueBounds.maxCost))}</span>
              </div>

              <p className="value-x-title">Cost of attendance (annual)</p>
            </div>

            <aside className="value-list" aria-label="Value chart college list">
              {(activeQuadrant ? valueFiltered : rankedValuePoints).map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  className={`value-list-row ${selectedSlug === item.slug ? "active" : ""}`}
                  onClick={() => setSelectedSlug(item.slug)}
                >
                  <div>
                    <b>#{item.rank} {item.name}</b>
                    <p>{item.settingLabel}</p>
                  </div>
                  <div>
                    <span>Cost {formatMoney(item.costOfAttendance)}</span>
                    <span>Earnings {formatMoney(item.medianEarnings10y)}</span>
                    <span className="value-rank">Value rank {index + 1}</span>
                  </div>
                </button>
              ))}
            </aside>
          </div>

          {activeQuadrant && (
            <div className="viz-filter-panel">
              <div className="viz-filter-header">
                <h4>Filtered to quadrant {activeQuadrant.toUpperCase()}</h4>
                <button type="button" className="ghost" onClick={() => setActiveQuadrant(null)}>
                  Clear
                </button>
              </div>
              <p className="meta">Only schools in this quadrant are emphasized in the chart and list.</p>
            </div>
          )}

          {selected && (
            <article className="inline-info-card" role="dialog" aria-label="Selected college info">
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
            </article>
          )}
        </div>
      )}
    </section>
  );
}
