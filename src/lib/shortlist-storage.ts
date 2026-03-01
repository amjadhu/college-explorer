import type { ShortlistState } from "@/lib/types";

export const SHORTLIST_STORAGE_KEY = "college-compass:shortlist:v1";

const emptyState = (): ShortlistState => ({ slugs: [], updatedAt: new Date(0).toISOString() });

export function readShortlist(storage: Pick<Storage, "getItem">): ShortlistState {
  try {
    const raw = storage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return emptyState();

    const parsed = JSON.parse(raw) as Partial<ShortlistState>;
    const slugs = Array.isArray(parsed.slugs)
      ? parsed.slugs.filter((value): value is string => typeof value === "string")
      : [];

    return {
      slugs: Array.from(new Set(slugs)),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return emptyState();
  }
}

export function writeShortlist(storage: Pick<Storage, "setItem">, slugs: string[]) {
  const state: ShortlistState = {
    slugs: Array.from(new Set(slugs)),
    updatedAt: new Date().toISOString()
  };

  storage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(state));
  return state;
}
