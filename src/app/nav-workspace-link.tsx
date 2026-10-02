"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readWorkspace } from "@/lib/workspace-storage";

export default function NavWorkspaceLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const workspace = readWorkspace(window.localStorage);
    setCount(workspace.entries.length);
  }, []);

  if (count === 0) return null;

  return (
    <Link href="/workspace" className="site-nav-workspace">
      Workspace ({count})
    </Link>
  );
}
