"use client";

import type { SchoolStatus, WorkspaceEntry } from "@/lib/types";

type Props = {
  entries: WorkspaceEntry[];
  activeStatus: SchoolStatus | "all";
  onSelect: (status: SchoolStatus | "all") => void;
};

const stages: Array<{ key: SchoolStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "researching", label: "Researching" },
  { key: "interested", label: "Interested" },
  { key: "applying", label: "Applying" },
  { key: "applied", label: "Applied" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "waitlisted", label: "Waitlisted" },
];

export default function StatusPipeline({ entries, activeStatus, onSelect }: Props) {
  return (
    <div className="workspace-pipeline">
      {stages.map((stage) => {
        const count = stage.key === "all"
          ? entries.length
          : entries.filter((e) => e.status === stage.key).length;

        if (count === 0 && stage.key !== "all" && stage.key !== activeStatus) return null;

        return (
          <button
            key={stage.key}
            type="button"
            className={`pipeline-stage ${activeStatus === stage.key ? "active" : ""}`}
            onClick={() => onSelect(stage.key)}
          >
            {stage.label}
            <span className="stage-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
