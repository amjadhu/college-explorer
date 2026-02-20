"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollegeRecord } from "@/lib/types";
import { formatMoney, formatPercent, localeBucket, ownershipLabel } from "@/lib/data";

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

  const filtered = useMemo(() => {
    return colleges.filter((c) => {
      const normalized = query.toLowerCase().trim();
      const matchesQuery =
        !normalized ||
        c.forbesName.toLowerCase().includes(normalized) ||
        c.city?.toLowerCase().includes(normalized) ||
        c.state?.toLowerCase().includes(normalized);

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
      <section className="hero">
        <h1>College Compass</h1>
        <p>
          Forbes Top 50 colleges with standardized metrics from College Scorecard. Compare cost, admissions,
          outcomes, and location context in one place.
        </p>
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
        <p className="meta" style={{ color: "rgba(255,255,255,0.9)", marginTop: "0.7rem" }}>
          Showing {filtered.length} of {colleges.length} schools. Ranking source: <a href={rankingSource.url}>{rankingSource.name}</a>. Data last refreshed: {new Date(fetchedAt).toLocaleString()}.
        </p>
      </section>

      <section className="grid" aria-label="College results">
        {filtered.map((college) => (
          <Link key={college.slug} href={`/colleges/${college.slug}`} className="card">
            <span className="badge">#{college.rank}</span>
            <h2 style={{ margin: "0.5rem 0 0.25rem" }}>{college.forbesName}</h2>
            <div className="meta">
              {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"} • {ownershipLabel(college.ownership)}
            </div>
            <div className="stats">
              <div className="stat">
                <b>Acceptance</b>
                <span>{formatPercent(college.admissionRate)}</span>
              </div>
              <div className="stat">
                <b>Net Cost</b>
                <span>{formatMoney(college.avgNetPrice)}</span>
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
