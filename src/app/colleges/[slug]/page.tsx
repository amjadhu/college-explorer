import Link from "next/link";
import { notFound } from "next/navigation";
import ShortlistButton from "@/app/shortlist-button";
import SchoolBriefing from "@/app/school-briefing";
import CollegeBriefing from "@/app/college-briefing";
import { getCollegeBySlug, readColleges } from "@/lib/data";
import { getBriefing, getBriefingsRemaining } from "@/app/actions/briefing-helpers";
import { formatMajorShare, formatMoney, formatPercent, ownershipLabel, formatSATRange, formatRatio } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CollegePage({ params }: Props) {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);
  const allColleges = await readColleges();

  if (!college) return notFound();

  // Fetch existing AI briefing and remaining count
  let briefing = null;
  let remaining = 20;
  try {
    [briefing, remaining] = await Promise.all([
      getBriefing(slug),
      getBriefingsRemaining(),
    ]);
  } catch {
    // DB not available (local dev without Turso) — gracefully continue
  }

  const website = college.website
    ? college.website.startsWith("http")
      ? college.website
      : `https://${college.website}`
    : null;

  // Program earnings for matched interests
  const programsWithEarnings = college.allMajors.filter(
    (m) => m.medianEarnings != null || m.medianDebt != null
  );

  return (
    <main>
      <Link href="/" className="meta" style={{ display: "inline-block", marginBottom: "0.8rem" }}>
        &larr; Back to explore
      </Link>

      <section className="hero-v2 detail-hero">
        <div className="detail-hero-top">
          <span className="badge">Rank #{college.rank}</span>
          <ShortlistButton slug={college.slug} className="save-btn" />
        </div>

        <h1>{college.displayName}</h1>
        <p>
          {college.city && college.state ? `${college.city}, ${college.state}` : "Location not available"} &middot; {ownershipLabel(college.ownership)} &middot; {college.settingLabel}
          {college.carnegieLabel !== "Not classified" && ` · ${college.carnegieLabel}`}
          {college.religiousLabel !== "Not affiliated" && ` · ${college.religiousLabel}`}
        </p>

        <div className="trust-row">
          <span>Source: <a href={college.rankingSource.url}>{college.rankingSource.name}</a></span>
          <span>Updated: {new Date(college.rankingSource.fetchedAt).toLocaleDateString()}</span>
          {college.enrollment && <span>Enrollment: {college.enrollment.toLocaleString()}</span>}
          {college.studentFacultyRatio && <span>Student-Faculty: {formatRatio(college.studentFacultyRatio)}</span>}
        </div>
      </section>

      {/* AI Briefing - primary intelligence section */}
      <CollegeBriefing
        slug={slug}
        initialBriefing={briefing ? {
          briefingData: briefing.briefingData,
          generatedAt: briefing.generatedAt,
          model: briefing.model,
        } : null}
        initialRemaining={remaining}
      />

      {/* Deterministic narrative briefing (client component) - supporting analysis */}
      <SchoolBriefing college={college} allColleges={allColleges} />

      {/* Program-level earnings/debt table */}
      {programsWithEarnings.length > 0 && (
        <section className="detail">
          <h2>Program-Level Earnings & Debt</h2>
          <p className="meta" style={{ marginBottom: "0.5rem" }}>
            Median earnings and debt by field of study at this school
          </p>
          <div className="program-earnings-grid">
            {programsWithEarnings.map((major) => (
              <div className="program-earnings-row" key={major.key}>
                <span className="program-name">{major.label}</span>
                <span className="program-share">{formatMajorShare(major.share)}</span>
                <span className="program-earn">
                  {major.medianEarnings != null ? formatMoney(major.medianEarnings) : "—"}
                </span>
                <span className="program-debt">
                  {major.medianDebt != null ? formatMoney(major.medianDebt) : "—"}
                </span>
              </div>
            ))}
            <div className="program-earnings-row program-earnings-header">
              <span className="program-name"><b>Program</b></span>
              <span className="program-share"><b>Enrollment</b></span>
              <span className="program-earn"><b>Earnings</b></span>
              <span className="program-debt"><b>Debt</b></span>
            </div>
          </div>
        </section>
      )}

      {/* Traditional stats sections */}
      <section className="detail">
        <h2>Admissions & Test Scores</h2>
        <div className="detail-grid">
          <div className="stat">
            <b>Acceptance rate</b>
            <span>{formatPercent(college.admissionRate)}</span>
          </div>
          <div className="stat">
            <b>Average SAT</b>
            <span>{college.satAvgScore?.toLocaleString() ?? "N/A"}</span>
          </div>
          <div className="stat">
            <b>SAT Math (25th-75th)</b>
            <span>{formatSATRange(college.satMath25, college.satMath75)}</span>
          </div>
          <div className="stat">
            <b>SAT Reading (25th-75th)</b>
            <span>{formatSATRange(college.satReading25, college.satReading75)}</span>
          </div>
          <div className="stat">
            <b>ACT Midpoint</b>
            <span>{college.actCumulativeMidpoint ?? "N/A"}</span>
          </div>
          <div className="stat">
            <b>Graduation rate</b>
            <span>{formatPercent(college.graduationRate)}</span>
          </div>
          <div className="stat">
            <b>Freshman retention</b>
            <span>{formatPercent(college.retentionRate)}</span>
          </div>
          <div className="stat">
            <b>Student-faculty ratio</b>
            <span>{formatRatio(college.studentFacultyRatio)}</span>
          </div>
        </div>
      </section>

      <section className="detail">
        <h2>Cost & Financial Aid</h2>
        <div className="detail-grid">
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
            <b>Average net price</b>
            <span>{formatMoney(college.avgNetPrice)}</span>
          </div>
          <div className="stat">
            <b>Pell Grant recipients</b>
            <span>{formatPercent(college.percentReceivingAid)}</span>
          </div>
          <div className="stat">
            <b>Median debt at graduation</b>
            <span>{formatMoney(college.medianDebt)}</span>
          </div>
          <div className="stat">
            <b>Federal loan rate</b>
            <span>{formatPercent(college.federalLoanRate)}</span>
          </div>
          <div className="stat">
            <b>Loan default rate (3yr)</b>
            <span>{formatPercent(college.federalLoanDefaultRate)}</span>
          </div>
        </div>
      </section>

      <section className="detail">
        <h2>Outcomes & Earnings</h2>
        <div className="detail-grid">
          <div className="stat">
            <b>Median earnings (10 years)</b>
            <span>{formatMoney(college.medianEarnings10y)}</span>
          </div>
          <div className="stat">
            <b>Enrollment</b>
            <span>{college.enrollment?.toLocaleString() ?? "N/A"}</span>
          </div>
          <div className="stat">
            <b>Campus setting</b>
            <span>{college.settingLabel}</span>
          </div>
          <div className="stat">
            <b>Official site</b>
            <span>{website ? <a href={website}>{college.website}</a> : "N/A"}</span>
          </div>
        </div>
      </section>

      {college.crimeRate != null && (
        <section className="detail">
          <h2>Campus Safety</h2>
          <div className="detail-grid">
            <div className="stat">
              <b>Total on-campus crimes</b>
              <span>{college.crimeTotalOnCampus?.toLocaleString() ?? "N/A"}</span>
            </div>
            <div className="stat">
              <b>Crime rate per 1,000 students</b>
              <span>{college.crimeRate.toFixed(1)}</span>
            </div>
          </div>
        </section>
      )}

      <section className="detail">
        <h2>Academic Programs</h2>
        {college.allMajors.length > 0 ? (
          <div className="major-grid">
            {college.allMajors.map((major) => (
              <div className="stat" key={major.key}>
                <b>{major.label}</b>
                <span>{formatMajorShare(major.share)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="meta">Program distribution is not available for this school.</p>
        )}
      </section>

      {(college.percentWhite != null || college.percentBlack != null) && (
        <section className="detail">
          <h2>Student Demographics</h2>
          <div className="detail-grid">
            <div className="stat">
              <b>Female</b>
              <span>{formatPercent(college.percentFemale)}</span>
            </div>
            <div className="stat">
              <b>Part-time</b>
              <span>{formatPercent(college.percentPartTime)}</span>
            </div>
            <div className="stat">
              <b>White</b>
              <span>{formatPercent(college.percentWhite)}</span>
            </div>
            <div className="stat">
              <b>Black</b>
              <span>{formatPercent(college.percentBlack)}</span>
            </div>
            <div className="stat">
              <b>Hispanic</b>
              <span>{formatPercent(college.percentHispanic)}</span>
            </div>
            <div className="stat">
              <b>Asian</b>
              <span>{formatPercent(college.percentAsian)}</span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
