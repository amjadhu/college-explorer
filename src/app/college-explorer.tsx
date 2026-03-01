"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CollegeMapPanel from "@/app/college-map-panel";
import CompareDrawer from "@/app/compare-drawer";
import ShortlistPanel from "@/app/shortlist-panel";
import { coverageCounts, filterColleges } from "@/lib/explorer";
import { formatMajorShare, formatMoney, formatPercent, ownershipLabel } from "@/lib/format";
import { readShortlist, writeShortlist } from "@/lib/shortlist-storage";
import type { CollegeRecord, Filters } from "@/lib/types";

type Props = {
  colleges: CollegeRecord[];
  fetchedAt: string;
  rankingSource: { name: string; url: string; fallbackUsed?: boolean; fallbackFrom?: string };
};

const defaultFilters: Filters = {
  query: "",
  state: "all",
  ownership: "all",
  locale: "all",
  view: "cards"
};

const parseParam = (params: URLSearchParams, key: string, allowed: string[], fallback: string) => {
  const value = params.get(key);
  return value && allowed.includes(value) ? value : fallback;
};

export default function CollegeExplorer({ colleges, fetchedAt, rankingSource }: Props) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      query: params.get("q") ?? "",
      state: params.get("state") ?? "all",
      ownership: parseParam(params, "ownership", ["all", "public", "private"], "all") as Filters["ownership"],
      locale: parseParam(params, "setting", ["all", "city", "suburb", "town", "rural"], "all") as Filters["locale"],
      view: parseParam(params, "view", ["cards", "list"], "cards") as Filters["view"]
    });

    const existing = readShortlist(window.localStorage);
    setShortlist(existing.slugs);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.state !== "all") params.set("state", filters.state);
    if (filters.ownership !== "all") params.set("ownership", filters.ownership);
    if (filters.locale !== "all") params.set("setting", filters.locale);
    if (filters.view !== "cards") params.set("view", filters.view);

    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [filters]);

  const states = useMemo(
    () => [...new Set(colleges.map((college) => college.state).filter((value): value is string => Boolean(value)))].sort(),
    [colleges]
  );

  const filtered = useMemo(() => filterColleges(colleges, filters), [colleges, filters]);
  const coverage = useMemo(() => coverageCounts(colleges), [colleges]);

  const shortlistColleges = useMemo(
    () => shortlist.map((slug) => colleges.find((college) => college.slug === slug)).filter((item): item is CollegeRecord => Boolean(item)),
    [shortlist, colleges]
  );

  const compareColleges = shortlistColleges.slice(0, 4);

  const setAndPersistShortlist = (next: string[]) => {
    setShortlist(next);
    writeShortlist(window.localStorage, next);
  };

  const toggleShortlist = (slug: string) => {
    if (shortlist.includes(slug)) {
      setAndPersistShortlist(shortlist.filter((item) => item !== slug));
      return;
    }

    setAndPersistShortlist([...shortlist, slug]);
  };

  return (
    <>
      <section className="hero-v2">
        <p className="kicker">College Compass V2</p>
        <h1>Explore Colleges. Narrow Confidently.</h1>
        <p>
          A shared student-parent workspace to browse top schools, evaluate tradeoffs, and build a confident shortlist.
        </p>

        <div className="trust-row">
          <span>Source: <a href={rankingSource.url}>{rankingSource.name}</a></span>
          <span>Updated: {new Date(fetchedAt).toLocaleDateString()}</span>
          <span>Admissions: {coverage.admissions}/{coverage.total}</span>
          <span>Cost: {coverage.cost}/{coverage.total}</span>
          <span>Earnings: {coverage.earnings}/{coverage.total}</span>
          {rankingSource.fallbackUsed && (
            <span className="fallback">Source fallback used ({rankingSource.fallbackFrom || "unknown"} to forbes)</span>
          )}
        </div>
      </section>

      <section className="explore-layout">
        <div className="explore-main">
          <section className="controls-shell sticky-controls">
            <div className="filters">
              <input
                placeholder="Search by college, city, or state"
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
              <select value={filters.state} onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}>
                <option value="all">All states</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <select
                value={filters.ownership}
                onChange={(event) => setFilters((prev) => ({ ...prev, ownership: event.target.value as Filters["ownership"] }))}
              >
                <option value="all">Public + Private</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <select
                value={filters.locale}
                onChange={(event) => setFilters((prev) => ({ ...prev, locale: event.target.value as Filters["locale"] }))}
              >
                <option value="all">Any setting</option>
                <option value="city">City</option>
                <option value="suburb">Suburb</option>
                <option value="town">Town</option>
                <option value="rural">Rural</option>
              </select>
            </div>

            <div className="controls-row">
              <p className="meta">Showing {filtered.length} of {colleges.length} schools</p>
              <div className="view-toggle" role="tablist" aria-label="Result views">
                <button
                  type="button"
                  className={filters.view === "cards" ? "active" : ""}
                  onClick={() => setFilters((prev) => ({ ...prev, view: "cards" }))}
                >
                  Cards
                </button>
                <button
                  type="button"
                  className={filters.view === "list" ? "active" : ""}
                  onClick={() => setFilters((prev) => ({ ...prev, view: "list" }))}
                >
                  List
                </button>
              </div>
            </div>
          </section>

          <section className="cards-header">
            <h2>Explore Colleges</h2>
            <button type="button" className="ghost" onClick={() => setMapExpanded((value) => !value)}>
              {mapExpanded ? "Hide visualizer" : "Show visualizer"}
            </button>
          </section>

          {mapExpanded && <CollegeMapPanel colleges={filtered} shortlistSlugs={shortlist} />}

          <section className={filters.view === "cards" ? "grid" : "list-grid"} aria-label="College results">
            {filtered.map((college) => {
              const isShortlisted = shortlist.includes(college.slug);
              return (
                <article key={college.slug} className={filters.view === "cards" ? "card" : "list-card"}>
                  <div className="card-top">
                    <span className="badge">#{college.rank}</span>
                    <button type="button" className="save-btn" onClick={() => toggleShortlist(college.slug)}>
                      {isShortlisted ? "Saved" : "Save"}
                    </button>
                  </div>

                  <h3>
                    <Link href={`/colleges/${college.slug}`}>{college.displayName}</Link>
                  </h3>

                  <p className="meta">
                    {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"} · {ownershipLabel(college.ownership)} · {college.settingLabel}
                  </p>

                  <div className="stats">
                    <div className="stat">
                      <b>Acceptance</b>
                      <span>{formatPercent(college.admissionRate)}</span>
                    </div>
                    <div className="stat">
                      <b>Cost of Attendance</b>
                      <span>{formatMoney(college.costOfAttendance)}</span>
                    </div>
                    <div className="stat">
                      <b>10y Earnings</b>
                      <span>{formatMoney(college.medianEarnings10y)}</span>
                    </div>
                  </div>

                  {college.topMajors.length > 0 && (
                    <div className="major-row">
                      {college.topMajors.map((major) => (
                        <span key={major.key} className="major-chip">
                          {major.label} {formatMajorShare(major.share)}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </div>

        <ShortlistPanel
          colleges={colleges}
          shortlist={shortlist}
          onRemove={(slug) => setAndPersistShortlist(shortlist.filter((item) => item !== slug))}
          onClear={() => setAndPersistShortlist([])}
          onOpenCompare={() => setCompareOpen(true)}
        />
      </section>

      <CompareDrawer open={compareOpen} colleges={compareColleges} onClose={() => setCompareOpen(false)} />
    </>
  );
}
