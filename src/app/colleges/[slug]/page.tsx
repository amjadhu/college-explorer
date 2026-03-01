import Link from "next/link";
import { notFound } from "next/navigation";
import ShortlistButton from "@/app/shortlist-button";
import { getCollegeBySlug, readColleges } from "@/lib/data";
import { formatMajorShare, formatMoney, formatPercent, ownershipLabel } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const colleges = await readColleges();
  return colleges.map((college) => ({ slug: college.slug }));
}

export default async function CollegePage({ params }: Props) {
  const { slug } = await params;
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
        ← Back to explore
      </Link>

      <section className="hero-v2 detail-hero">
        <div className="detail-hero-top">
          <span className="badge">Rank #{college.rank}</span>
          <ShortlistButton slug={college.slug} className="save-btn" />
        </div>

        <h1>{college.displayName}</h1>
        <p>
          {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"} · {ownershipLabel(college.ownership)} · {college.settingLabel}
        </p>

        <div className="trust-row">
          <span>Source: <a href={college.rankingSource.url}>{college.rankingSource.name}</a></span>
          <span>Updated: {new Date(college.rankingSource.fetchedAt).toLocaleDateString()}</span>
          <span>Admissions: {college.dataQuality.hasAdmissions ? "Available" : "N/A"}</span>
          <span>Cost: {college.dataQuality.hasCost ? "Available" : "N/A"}</span>
          <span>Earnings: {college.dataQuality.hasEarnings ? "Available" : "N/A"}</span>
        </div>
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
            <b>Cost of attendance</b>
            <span>{formatMoney(college.costOfAttendance)}</span>
          </div>
          <div className="stat">
            <b>Enrollment</b>
            <span>{college.enrollment?.toLocaleString() ?? "N/A"}</span>
          </div>
        </div>
      </section>

      <section className="detail">
        <h2>Outcomes & Setting</h2>
        <div className="detail-grid">
          <div className="stat">
            <b>Median earnings (10 years)</b>
            <span>{formatMoney(college.medianEarnings10y)}</span>
          </div>
          <div className="stat">
            <b>Campus setting</b>
            <span>{college.settingLabel}</span>
          </div>
          <div className="stat">
            <b>Coordinates</b>
            <span>
              {college.latitude && college.longitude ? `${college.latitude.toFixed(4)}, ${college.longitude.toFixed(4)}` : "N/A"}
            </span>
          </div>
          <div className="stat">
            <b>Official site</b>
            <span>{website ? <a href={website}>{college.website}</a> : "N/A"}</span>
          </div>
        </div>
      </section>

      <section className="detail">
        <h2>Academic Strengths</h2>
        {college.topMajors.length > 0 ? (
          <div className="major-grid">
            {college.topMajors.map((major) => (
              <div className="stat" key={major.key}>
                <b>{major.label}</b>
                <span>{formatMajorShare(major.share)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="meta">Major distribution is not available for this school.</p>
        )}
      </section>
    </main>
  );
}
