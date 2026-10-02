"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import StatusPipeline from "@/app/status-pipeline";
import WorkspaceEntryCard from "@/app/workspace-entry";
import type { CollegeRecord, SchoolStatus, WorkspaceState } from "@/lib/types";
import {
  readWorkspace,
  writeWorkspace,
  removeFromWorkspace,
  updateWorkspaceEntry,
} from "@/lib/workspace-storage";
import { readPreferences } from "@/lib/preferences-storage";

type Props = {
  allColleges: CollegeRecord[];
};

export default function WorkspacePanel({ allColleges }: Props) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({ entries: [], updatedAt: "" });
  const [statusFilter, setStatusFilter] = useState<SchoolStatus | "all">("all");
  const [homeLat, setHomeLat] = useState<number | null>(null);
  const [homeLon, setHomeLon] = useState<number | null>(null);

  useEffect(() => {
    const ws = readWorkspace(window.localStorage);
    setWorkspace(ws);

    // Also persist workspace on first load (handles migration)
    if (ws.entries.length > 0) {
      writeWorkspace(window.localStorage, ws);
    }

    const prefs = readPreferences(window.localStorage);
    setHomeLat(prefs.homeLatitude);
    setHomeLon(prefs.homeLongitude);
  }, []);

  const filteredEntries = useMemo(() => {
    if (statusFilter === "all") return workspace.entries;
    return workspace.entries.filter((e) => e.status === statusFilter);
  }, [workspace.entries, statusFilter]);

  const handleStatusChange = (slug: string, status: SchoolStatus) => {
    const updated = updateWorkspaceEntry(window.localStorage, slug, { status });
    setWorkspace(updated);
  };

  const handleNotesChange = (slug: string, notes: string) => {
    const updated = updateWorkspaceEntry(window.localStorage, slug, { notes });
    setWorkspace(updated);
  };

  const handleRemove = (slug: string) => {
    const updated = removeFromWorkspace(window.localStorage, slug);
    setWorkspace(updated);
  };

  if (workspace.entries.length === 0) {
    return (
      <div className="narrative-section">
        <h2>Your Workspace is Empty</h2>
        <p className="meta">
          Save schools from the <Link href="/">home page</Link> to start building your college list.
          Schools you save will appear here with status tracking, notes, and more.
        </p>
      </div>
    );
  }

  return (
    <>
      <StatusPipeline
        entries={workspace.entries}
        activeStatus={statusFilter}
        onSelect={setStatusFilter}
      />

      <div className="workspace-entries">
        {filteredEntries.map((entry) => {
          const college = allColleges.find((c) => c.slug === entry.slug) ?? null;
          return (
            <WorkspaceEntryCard
              key={entry.slug}
              entry={entry}
              college={college}
              homeLat={homeLat}
              homeLon={homeLon}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              onRemove={handleRemove}
            />
          );
        })}
      </div>
    </>
  );
}
