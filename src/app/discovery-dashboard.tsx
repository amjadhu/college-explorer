"use client";

import { useEffect, useMemo, useState } from "react";
import CollegeMapPanel from "@/app/college-map-panel";
import PreferencesModal from "@/app/preferences-modal";
import MatchCard from "@/app/match-card";
import InsightStrip from "@/app/insight-strip";
import DimensionExplorer from "@/app/dimension-explorer";
import { coverageCounts, filterColleges } from "@/lib/explorer";
import { readPreferences, writePreferences, defaultPreferences } from "@/lib/preferences-storage";
import { readShortlist, writeShortlist } from "@/lib/shortlist-storage";
import { addToWorkspace, removeFromWorkspace } from "@/lib/workspace-storage";
import { rankByFamilyScore } from "@/lib/scoring";
import type { CollegeRecord, Filters, FamilyPreferences } from "@/lib/types";

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
  satRange: "all",
  sizeRange: "all",
  view: "cards",
};

const parseParam = (params: URLSearchParams, key: string, allowed: string[], fallback: string) => {
  const value = params.get(key);
  return value && allowed.includes(value) ? value : fallback;
};

export default function DiscoveryDashboard({ colleges, fetchedAt, rankingSource }: Props) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<FamilyPreferences>(defaultPreferences());
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      query: params.get("q") ?? "",
      state: params.get("state") ?? "all",
      ownership: parseParam(params, "ownership", ["all", "public", "private"], "all") as Filters["ownership"],
      locale: parseParam(params, "setting", ["all", "city", "suburb", "town", "rural"], "all") as Filters["locale"],
      satRange: parseParam(params, "sat", ["all", "1400+", "1200-1399", "1000-1199", "below-1000"], "all") as Filters["satRange"],
      sizeRange: parseParam(params, "size", ["all", "small", "medium", "large"], "all") as Filters["sizeRange"],
      view: parseParam(params, "view", ["cards", "list"], "cards") as Filters["view"],
    });

    const existing = readShortlist(window.localStorage);
    setShortlist(existing.slugs);

    const prefs = readPreferences(window.localStorage);
    setPreferences(prefs);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.state !== "all") params.set("state", filters.state);
    if (filters.ownership !== "all") params.set("ownership", filters.ownership);
    if (filters.locale !== "all") params.set("setting", filters.locale);
    if (filters.satRange !== "all") params.set("sat", filters.satRange);
    if (filters.sizeRange !== "all") params.set("size", filters.sizeRange);
    if (filters.view !== "cards") params.set("view", filters.view);

    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [filters]);

  const states = useMemo(
    () => [...new Set(colleges.map((c) => c.state).filter((v): v is string => Boolean(v)))].sort(),
    [colleges]
  );

  const filtered = useMemo(() => filterColleges(colleges, filters), [colleges, filters]);
  const coverage = useMemo(() => coverageCounts(colleges), [colleges]);

  // Rank by Family Score
  const ranked = useMemo(() => {
    const allRanked = rankByFamilyScore(colleges, preferences);
    const filteredSlugs = new Set(filtered.map((c) => c.slug));
    return allRanked.filter((r) => filteredSlugs.has(r.college.slug));
  }, [colleges, preferences, filtered]);

  const setAndPersistShortlist = (next: string[]) => {
    setShortlist(next);
    writeShortlist(window.localStorage, next);
  };

  const toggleShortlist = (slug: string) => {
    if (shortlist.includes(slug)) {
      setAndPersistShortlist(shortlist.filter((s) => s !== slug));
      removeFromWorkspace(window.localStorage, slug);
    } else {
      setAndPersistShortlist([...shortlist, slug]);
      addToWorkspace(window.localStorage, slug);
    }
  };

  const savePreferences = (prefs: FamilyPreferences) => {
    setPreferences(prefs);
    writePreferences(window.localStorage, prefs);
  };

  const hasCustomPrefs = Object.values(preferences.weights).some((w) => w !== 50) || preferences.interests.length > 0;

  return (
    <>
      <section className="hero-v2">
        <p className="kicker">College Compass</p>
        <h1>Your Family&apos;s College Intelligence</h1>
        <p>
          Personalized insights for your college search — not just data, but what it means for your family.
        </p>

        <div className="trust-row">
          <span>Source: <a href={rankingSource.url}>{rankingSource.name}</a></span>
          <span>Updated: {new Date(fetchedAt).toLocaleDateString()}</span>
          <span>Schools: {coverage.total}</span>
          {rankingSource.fallbackUsed && (
            <span className="fallback">Source fallback used ({rankingSource.fallbackFrom || "unknown"} to forbes)</span>
          )}
        </div>
      </section>

      <div className="dashboard-actions">
        <button type="button" className="prefs-trigger" onClick={() => setPrefsOpen(true)}>
          {hasCustomPrefs ? "Edit Preferences" : "Set What Matters to You"}
        </button>
        {shortlist.length > 0 && (
          <a href="/workspace" className="workspace-link">
            Workspace ({shortlist.length})
          </a>
        )}
      </div>

      {hasCustomPrefs && <InsightStrip ranked={ranked} interests={preferences.interests} />}

      <section className="controls-shell sticky-controls">
        <div className="filters">
          <input
            placeholder="Search by college, city, or state"
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          />
          <select value={filters.state} onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}>
            <option value="all">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.ownership} onChange={(e) => setFilters((prev) => ({ ...prev, ownership: e.target.value as Filters["ownership"] }))}>
            <option value="all">Public + Private</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select value={filters.locale} onChange={(e) => setFilters((prev) => ({ ...prev, locale: e.target.value as Filters["locale"] }))}>
            <option value="all">Any setting</option>
            <option value="city">City</option>
            <option value="suburb">Suburb</option>
            <option value="town">Town</option>
            <option value="rural">Rural</option>
          </select>
        </div>
        <div className="filters-row-2">
          <select value={filters.satRange} onChange={(e) => setFilters((prev) => ({ ...prev, satRange: e.target.value as Filters["satRange"] }))}>
            <option value="all">Any SAT range</option>
            <option value="1400+">SAT 1400+</option>
            <option value="1200-1399">SAT 1200-1399</option>
            <option value="1000-1199">SAT 1000-1199</option>
            <option value="below-1000">SAT below 1000</option>
          </select>
          <select value={filters.sizeRange} onChange={(e) => setFilters((prev) => ({ ...prev, sizeRange: e.target.value as Filters["sizeRange"] }))}>
            <option value="all">Any size</option>
            <option value="small">Small (&lt;5,000)</option>
            <option value="medium">Medium (5,000-15,000)</option>
            <option value="large">Large (15,000+)</option>
          </select>
        </div>

        <div className="controls-row">
          <p className="meta">
            {hasCustomPrefs ? "Ranked by Family Score" : "Ranked by national ranking"} · Showing {filtered.length} of {colleges.length} schools
          </p>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button type="button" className="ghost" onClick={() => setMapExpanded((v) => !v)}>
              {mapExpanded ? "Hide map" : "Show map"}
            </button>
            <div className="view-toggle" role="tablist" aria-label="Result views">
              <button type="button" className={filters.view === "cards" ? "active" : ""} onClick={() => setFilters((prev) => ({ ...prev, view: "cards" }))}>
                Cards
              </button>
              <button type="button" className={filters.view === "list" ? "active" : ""} onClick={() => setFilters((prev) => ({ ...prev, view: "list" }))}>
                List
              </button>
            </div>
          </div>
        </div>
      </section>

      {mapExpanded && <CollegeMapPanel colleges={filtered} shortlistSlugs={shortlist} />}

      {hasCustomPrefs && <DimensionExplorer ranked={ranked} />}

      <section className="cards-header">
        <h2>{hasCustomPrefs ? "Your Top Matches" : "Explore Colleges"}</h2>
      </section>

      <section className={filters.view === "cards" ? "grid" : "list-grid"} aria-label="College results">
        {ranked.map(({ college, familyScore }) => (
          <MatchCard
            key={college.slug}
            college={college}
            familyScore={familyScore}
            onSave={toggleShortlist}
            isSaved={shortlist.includes(college.slug)}
          />
        ))}
      </section>

      <PreferencesModal
        open={prefsOpen}
        preferences={preferences}
        onSave={savePreferences}
        onClose={() => setPrefsOpen(false)}
      />
    </>
  );
}
