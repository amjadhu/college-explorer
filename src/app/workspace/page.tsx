import Link from "next/link";
import WorkspacePanel from "@/app/workspace-panel";
import { readColleges } from "@/lib/data";

export default async function WorkspacePage() {
  const colleges = await readColleges();

  return (
    <main>
      <Link href="/" className="meta" style={{ display: "inline-block", marginBottom: "0.8rem" }}>
        &larr; Back to explore
      </Link>

      <section className="hero-v2" style={{ marginBottom: "1rem" }}>
        <p className="kicker">College Compass</p>
        <h1>Family Workspace</h1>
        <p>Track your college journey — from research to decisions. Notes, status tracking, and everything in one place.</p>

        <div className="trust-row">
          <span><Link href="/compare">Compare saved schools</Link></span>
        </div>
      </section>

      <WorkspacePanel allColleges={colleges} />
    </main>
  );
}
