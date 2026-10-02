import Link from "next/link";
import ComparisonView from "@/app/compare/comparison-view";
import { readColleges } from "@/lib/data";

export default async function ComparePage() {
  const colleges = await readColleges();

  return (
    <main>
      <Link href="/" className="meta" style={{ display: "inline-block", marginBottom: "0.8rem" }}>
        &larr; Back to explore
      </Link>

      <section className="hero-v2" style={{ marginBottom: "1rem" }}>
        <p className="kicker">College Compass</p>
        <h1>Compare Schools</h1>
        <p>Side-by-side comparison with radar charts and plain-language trade-off summaries.</p>
      </section>

      <section className="detail">
        <ComparisonView allColleges={colleges} />
      </section>
    </main>
  );
}
