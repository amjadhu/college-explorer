"use client";

import Link from "next/link";
import NotesEditor from "@/app/notes-editor";
import type { CollegeRecord, SchoolStatus, WorkspaceEntry as WorkspaceEntryType } from "@/lib/types";
import { formatMoney, formatPercent, formatDistance } from "@/lib/format";
import { distanceFromHome } from "@/lib/distance";

type Props = {
  entry: WorkspaceEntryType;
  college: CollegeRecord | null;
  homeLat: number | null;
  homeLon: number | null;
  onStatusChange: (slug: string, status: SchoolStatus) => void;
  onNotesChange: (slug: string, notes: string) => void;
  onRemove: (slug: string) => void;
};

const statusOptions: Array<{ value: SchoolStatus; label: string }> = [
  { value: "researching", label: "Researching" },
  { value: "interested", label: "Interested" },
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
];

export default function WorkspaceEntryCard({
  entry, college, homeLat, homeLon, onStatusChange, onNotesChange, onRemove
}: Props) {
  if (!college) return null;

  const distance = distanceFromHome(homeLat, homeLon, college.latitude, college.longitude);

  return (
    <div className="workspace-entry">
      <div className="workspace-entry-top">
        <div className="workspace-entry-info">
          <h3>
            <Link href={`/colleges/${college.slug}`}>
              <span className="badge" style={{ marginRight: "0.4rem" }}>#{college.rank}</span>
              {college.displayName}
            </Link>
          </h3>
          <p className="meta">
            {college.city && college.state ? `${college.city}, ${college.state}` : ""}
            {distance != null && ` · ${formatDistance(distance)} from home`}
          </p>
        </div>
        <div className="workspace-entry-actions">
          <select
            value={entry.status}
            onChange={(e) => onStatusChange(entry.slug, e.target.value as SchoolStatus)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => onRemove(entry.slug)}>Remove</button>
        </div>
      </div>

      <div className="workspace-entry-body">
        <div className="workspace-meta">
          <span>Acceptance: {formatPercent(college.admissionRate)}</span>
          <span>Net Price: {formatMoney(college.avgNetPrice ?? college.costOfAttendance)}</span>
          <span>Earnings: {formatMoney(college.medianEarnings10y)}</span>
          <span>Added: {new Date(entry.addedAt).toLocaleDateString()}</span>
        </div>

        <NotesEditor
          value={entry.notes}
          onChange={(notes) => onNotesChange(entry.slug, notes)}
        />
      </div>
    </div>
  );
}
