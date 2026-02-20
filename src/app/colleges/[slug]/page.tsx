import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney, formatPercent, getCollegeBySlug, ownershipLabel, readColleges } from "@/lib/data";

type Props = {
  params: { slug: string };
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const colleges = await readColleges();
  return colleges.map((college) => ({ slug: college.slug }));
}

export default async function CollegePage({ params }: Props) {
  const { slug } = params;
  const college = await getCollegeBySlug(slug);

  if (!college) return notFound();
  const website = college.website
    ? college.website.startsWith("http")
      ? college.website
      : `https://${college.website}`
    : null;

  return (
    <main>
      <Link href="/" className="meta" style={{ display: "inline-block", marginBottom: "0.8rem" }}>
        ← Back to rankings
      </Link>
      <section className="hero">
        <span className="badge">Forbes Rank #{college.rank}</span>
        <h1 style={{ marginBottom: "0.4rem" }}>{college.forbesName}</h1>
        <p>
          {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"} • {ownershipLabel(college.ownership)}
        </p>
      </section>

      <section className="detail">
        <h2>Admissions & Cost</h2>
        <div className="detail-grid">
          <div className="stat">
            <b>Acceptance rate</b>
            <span>{formatPercent(college.admissionRate)}</span>
          </div>
          <div className="stat">
            <b>Graduation rate</b>
            <span>{formatPercent(college.graduationRate)}</span>
          </div>
          <div className="stat">
            <b>In-state tuition</b>
            <span>{formatMoney(college.tuitionInState)}</span>
          </div>
          <div className="stat">
            <b>Out-of-state tuition</b>
            <span>{formatMoney(college.tuitionOutOfState)}</span>
          </div>
          <div className="stat">
            <b>Average net price</b>
            <span>{formatMoney(college.avgNetPrice)}</span>
          </div>
          <div className="stat">
            <b>Enrollment</b>
            <span>{college.enrollment?.toLocaleString() ?? "N/A"}</span>
          </div>
        </div>
      </section>

      <section className="detail">
        <h2>Outcomes & Location</h2>
        <div className="detail-grid">
          <div className="stat">
            <b>Median earnings (10 years)</b>
            <span>{formatMoney(college.medianEarnings10y)}</span>
          </div>
          <div className="stat">
            <b>Campus setting</b>
            <span>{college.locale ?? "N/A"}</span>
          </div>
          <div className="stat">
            <b>Coordinates</b>
            <span>
              {college.latitude && college.longitude
                ? `${college.latitude.toFixed(4)}, ${college.longitude.toFixed(4)}`
                : "N/A"}
            </span>
          </div>
          <div className="stat">
            <b>Official site</b>
            <span>{website ? <a href={website}>{college.website}</a> : "N/A"}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
