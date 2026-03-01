"use client";

import Link from "next/link";
import type { CollegeRecord } from "@/lib/types";

type Props = {
  colleges: CollegeRecord[];
  shortlist: string[];
  onRemove: (slug: string) => void;
  onClear: () => void;
  onOpenCompare: () => void;
};

export default function ShortlistPanel({ colleges, shortlist, onRemove, onClear, onOpenCompare }: Props) {
  const items = shortlist
    .map((slug) => colleges.find((college) => college.slug === slug))
    .filter((item): item is CollegeRecord => Boolean(item));

  const compareReady = items.length >= 2;

  return (
    <aside className="shortlist-panel" aria-label="Shortlist panel">
      <div className="shortlist-header">
        <h2>Shortlist</h2>
        <span>{items.length}</span>
      </div>

      {!items.length && <p className="meta">Save schools while exploring. Your shortlist stays on this device.</p>}

      {items.length > 0 && (
        <>
          <ul className="shortlist-list">
            {items.map((college) => (
              <li key={college.slug} className="shortlist-item">
                <Link href={`/colleges/${college.slug}`}>
                  <b>#{college.rank}</b> {college.displayName}
                </Link>
                <button type="button" onClick={() => onRemove(college.slug)} aria-label={`Remove ${college.displayName}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="shortlist-actions">
            <button type="button" onClick={onOpenCompare} disabled={!compareReady}>
              Compare {Math.min(items.length, 4)}
            </button>
            <button type="button" className="ghost" onClick={onClear}>
              Clear all
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
