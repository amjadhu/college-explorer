"use client";

import { useEffect, useState } from "react";
import { readShortlist, SHORTLIST_STORAGE_KEY, writeShortlist } from "@/lib/shortlist-storage";
import { addToWorkspace, removeFromWorkspace, readWorkspace, WORKSPACE_STORAGE_KEY } from "@/lib/workspace-storage";

type Props = {
  slug: string;
  className?: string;
};

export default function ShortlistButton({ slug, className }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Check both workspace and shortlist for backward compat
    const workspace = readWorkspace(window.localStorage);
    const shortlist = readShortlist(window.localStorage);
    setSaved(workspace.entries.some((e) => e.slug === slug) || shortlist.slugs.includes(slug));

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SHORTLIST_STORAGE_KEY && event.key !== WORKSPACE_STORAGE_KEY) return;
      const ws = readWorkspace(window.localStorage);
      const sl = readShortlist(window.localStorage);
      setSaved(ws.entries.some((e) => e.slug === slug) || sl.slugs.includes(slug));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [slug]);

  const toggle = () => {
    const shortlist = readShortlist(window.localStorage);
    const workspace = readWorkspace(window.localStorage);
    const inShortlist = shortlist.slugs.includes(slug);
    const inWorkspace = workspace.entries.some((e) => e.slug === slug);

    if (inShortlist || inWorkspace) {
      // Remove from both
      writeShortlist(window.localStorage, shortlist.slugs.filter((s) => s !== slug));
      if (inWorkspace) removeFromWorkspace(window.localStorage, slug);
      setSaved(false);
    } else {
      // Add to both
      writeShortlist(window.localStorage, [...shortlist.slugs, slug]);
      addToWorkspace(window.localStorage, slug);
      setSaved(true);
    }
  };

  return (
    <button type="button" className={className} onClick={toggle}>
      {saved ? "Remove from shortlist" : "Save to shortlist"}
    </button>
  );
}
