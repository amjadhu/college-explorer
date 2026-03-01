"use client";

import { useEffect, useState } from "react";
import { readShortlist, SHORTLIST_STORAGE_KEY, writeShortlist } from "@/lib/shortlist-storage";

type Props = {
  slug: string;
  className?: string;
};

export default function ShortlistButton({ slug, className }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const shortlist = readShortlist(window.localStorage);
    setSaved(shortlist.slugs.includes(slug));

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SHORTLIST_STORAGE_KEY) return;
      const next = readShortlist(window.localStorage);
      setSaved(next.slugs.includes(slug));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [slug]);

  const toggle = () => {
    const shortlist = readShortlist(window.localStorage);
    const next = shortlist.slugs.includes(slug)
      ? shortlist.slugs.filter((value) => value !== slug)
      : [...shortlist.slugs, slug];

    writeShortlist(window.localStorage, next);
    setSaved(next.includes(slug));
  };

  return (
    <button type="button" className={className} onClick={toggle}>
      {saved ? "Remove from shortlist" : "Save to shortlist"}
    </button>
  );
}
