"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CollegeMapPanel from "@/app/college-map-panel";
import type { CollegeRecord } from "@/lib/types";
import { formatMoney, formatPercent, localeBucket, ownershipLabel } from "@/lib/format";

type Props = {
  colleges: CollegeRecord[];
  fetchedAt: string;
  rankingSource: { name: string; url: string };
};

export default function CollegeExplorer({ colleges, fetchedAt, rankingSource }: Props) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [ownership, setOwnership] = useState<"all" | "public" | "private">("all");
  const [locale, setLocale] = useState<"all" | "city" | "suburb" | "town" | "rural">("all");

  const states = useMemo(
    () => [...new Set(colleges.map((c) => c.state).filter((v): v is string => Boolean(v)))].sort(),
    [colleges]
  );

  const text = (value: unknown): string => (typeof value === "string" ? value.toLowerCase() : "");

  const filtered = useMemo(() => {
    return colleges.filter((c) => {
      const normalized = query.toLowerCase().trim();
      const matchesQuery =
        !normalized ||
        text(c.forbesName).includes(normalized) ||
        text(c.city).includes(normalized) ||
        text(c.state).includes(normalized);

      const matchesState = state === "all" || c.state === state;
      const label = ownershipLabel(c.ownership).toLowerCase();
      const matchesOwnership = ownership === "all" || label === ownership;
      const bucket = localeBucket(c.locale);
      const matchesLocale = locale === "all" || bucket === locale;

      return matchesQuery && matchesState && matchesOwnership && matchesLocale;
    });
  }, [colleges, query, state, ownership, locale]);

  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="kicker">College Search MVP</p>
          <h1>College Compass</h1>
          <p>
            A better way for students to compare top schools. Explore admissions, outcomes, cost of attendance, and
            setting context across the top 50.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric-card">
            <b>Schools Indexed</b>
            <span>{colleges.length}</span>
          </div>
          <div className="hero-metric-card">
            <b>Visible</b>
            <span>{filtered.length}</span>
          </div>
          <div className="hero-metric-card">
            <b>Updated</b>
            <span>{new Date(fetchedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </section>

      <section className="controls-shell">
        <div className="filters">
          <input
            placeholder="Search by college, city, or state"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="all">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={ownership} onChange={(e) => setOwnership(e.target.value as typeof ownership)}>
            <option value="all">Public + Private</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <select value={locale} onChange={(e) => setLocale(e.target.value as typeof locale)}>
            <option value="all">Any setting</option>
            <option value="city">City</option>
            <option value="suburb">Suburb</option>
            <option value="town">Town</option>
            <option value="rural">Rural</option>
          </select>
        </div>

        <p className="meta controls-meta">
          Ranking source: <a href={rankingSource.url}>{rankingSource.name}</a>
        </p>
      </section>

      <CollegeMapPanel colleges={filtered} />

      <section className="cards-header">
        <h2>College Cards</h2>
        <p className="meta">Click a card to open the full profile.</p>
      </section>

      <section className="grid" aria-label="College results">
        {filtered.map((college) => (
          <Link key={college.slug} href={`/colleges/${college.slug}`} className="card">
            <span className="badge">#{college.rank}</span>
            <h3>{college.forbesName}</h3>
            <div className="meta">
              {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"} · {ownershipLabel(college.ownership)}
            </div>
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
          </Link>
        ))}
      </section>
    </>
  );
}
