import type { SchoolStatus, WorkspaceEntry, WorkspaceState } from "@/lib/types";
import { SHORTLIST_STORAGE_KEY } from "@/lib/shortlist-storage";

export const WORKSPACE_STORAGE_KEY = "college-compass:workspace:v1";

const emptyState = (): WorkspaceState => ({
  entries: [],
  updatedAt: new Date(0).toISOString(),
});

/** Migrate from old shortlist format to workspace format if needed. */
function migrateFromShortlist(storage: Pick<Storage, "getItem">): WorkspaceEntry[] {
  try {
    const raw = storage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as { slugs?: string[]; updatedAt?: string };
    if (!Array.isArray(parsed.slugs)) return [];

    const now = new Date().toISOString();
    return parsed.slugs
      .filter((s): s is string => typeof s === "string")
      .map((slug) => ({
        slug,
        status: "researching" as SchoolStatus,
        notes: "",
        addedAt: parsed.updatedAt ?? now,
        updatedAt: parsed.updatedAt ?? now,
      }));
  } catch {
    return [];
  }
}

export function readWorkspace(storage: Pick<Storage, "getItem">): WorkspaceState {
  try {
    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      // Try migrating from old shortlist
      const migrated = migrateFromShortlist(storage);
      if (migrated.length > 0) {
        return {
          entries: migrated,
          updatedAt: new Date().toISOString(),
        };
      }
      return emptyState();
    }

    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter(
          (e): e is WorkspaceEntry =>
            typeof e === "object" &&
            e != null &&
            typeof e.slug === "string"
        )
      : [];

    return {
      entries,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyState();
  }
}

export function writeWorkspace(
  storage: Pick<Storage, "setItem">,
  state: WorkspaceState
): void {
  const updated: WorkspaceState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(updated));
}

export function addToWorkspace(
  storage: Pick<Storage, "getItem" | "setItem">,
  slug: string
): WorkspaceState {
  const state = readWorkspace(storage);
  if (state.entries.some((e) => e.slug === slug)) return state;

  const now = new Date().toISOString();
  const entry: WorkspaceEntry = {
    slug,
    status: "researching",
    notes: "",
    addedAt: now,
    updatedAt: now,
  };

  const updated: WorkspaceState = {
    entries: [...state.entries, entry],
    updatedAt: now,
  };

  writeWorkspace(storage, updated);
  return updated;
}

export function removeFromWorkspace(
  storage: Pick<Storage, "getItem" | "setItem">,
  slug: string
): WorkspaceState {
  const state = readWorkspace(storage);
  const updated: WorkspaceState = {
    entries: state.entries.filter((e) => e.slug !== slug),
    updatedAt: new Date().toISOString(),
  };

  writeWorkspace(storage, updated);
  return updated;
}

export function updateWorkspaceEntry(
  storage: Pick<Storage, "getItem" | "setItem">,
  slug: string,
  updates: Partial<Pick<WorkspaceEntry, "status" | "notes">>
): WorkspaceState {
  const state = readWorkspace(storage);
  const now = new Date().toISOString();

  const updated: WorkspaceState = {
    entries: state.entries.map((e) =>
      e.slug === slug ? { ...e, ...updates, updatedAt: now } : e
    ),
    updatedAt: now,
  };

  writeWorkspace(storage, updated);
  return updated;
}
