"use client";

import Link from "next/link";
import type { CollegeRecord } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";

type Props = {
  college: CollegeRecord;
  allColleges: CollegeRecord[];
};

function findPeers(college: CollegeRecord, allColleges: CollegeRecord[]): CollegeRecord[] {
  // Find 3-4 schools with similar rank
  const rankWindow = 10;
  return allColleges
    .filter((c) => c.slug !== college.slug && Math.abs(c.rank - college.rank) <= rankWindow)
    .slice(0, 3);
}

export default function PeerComparison({ college, allColleges }: Props) {
  const peers = findPeers(college, allColleges);

  if (peers.length === 0) return null;

  const all = [college, ...peers];

  return (
    <section className="peer-section">
      <h2>Peer Comparison</h2>
      <p className="meta">Compared against similarly-ranked schools</p>

      <div className="peer-grid">
        {all.map((c) => (
          <div key={c.slug} className={`peer-card ${c.slug === college.slug ? "current" : ""}`}>
            <h4>
              {c.slug === college.slug ? c.displayName : (
                <Link href={`/colleges/${c.slug}`}>{c.displayName}</Link>
              )}
            </h4>
            <span className="badge">#{c.rank}</span>
            <div className="peer-stats">
              <div className="peer-stat">
                <b>Acceptance</b>
                <span>{formatPercent(c.admissionRate)}</span>
              </div>
              <div className="peer-stat">
                <b>Net Price</b>
                <span>{formatMoney(c.avgNetPrice)}</span>
              </div>
              <div className="peer-stat">
                <b>Earnings (10y)</b>
                <span>{formatMoney(c.medianEarnings10y)}</span>
              </div>
              <div className="peer-stat">
                <b>Graduation</b>
                <span>{formatPercent(c.graduationRate)}</span>
              </div>
              <div className="peer-stat">
                <b>Retention</b>
                <span>{formatPercent(c.retentionRate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
