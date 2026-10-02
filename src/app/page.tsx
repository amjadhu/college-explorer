import DiscoveryDashboard from "@/app/discovery-dashboard";
import { readColleges } from "@/lib/data";
import { getBriefingsForSlugs } from "@/app/actions/briefing-helpers";
import type { CollegeBriefingData } from "@/app/actions/briefing";

export default async function HomePage() {
  const colleges = await readColleges();

  if (!colleges.length) {
    return (
      <main>
        <section className="hero-v2">
          <h1>College Compass</h1>
          <p>No data loaded yet. Run `npm run data:refresh` after setting `COLLEGE_SCORECARD_API_KEY`.</p>
        </section>
      </main>
    );
  }

  const { rankingSource } = colleges[0];

  // Fetch existing briefings for all colleges to display on cards
  let briefings: Record<string, CollegeBriefingData> = {};
  try {
    const slugs = colleges.map((c) => c.slug);
    const stored = await getBriefingsForSlugs(slugs);
    for (const b of stored) {
      briefings[b.slug] = b.briefingData;
    }
  } catch {
    // DB not available — continue without briefings
  }

  return (
    <main>
      <DiscoveryDashboard
        colleges={colleges}
        fetchedAt={rankingSource.fetchedAt}
        rankingSource={rankingSource}
        briefings={briefings}
      />
    </main>
  );
}
