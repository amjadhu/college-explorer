import CollegeExplorer from "@/app/college-explorer";
import { readColleges } from "@/lib/data";

export default async function HomePage() {
  const colleges = await readColleges();

  if (!colleges.length) {
    return (
      <main>
        <section className="hero">
          <h1>College Compass</h1>
          <p>No data loaded yet. Run `npm run data:refresh` after setting `COLLEGE_SCORECARD_API_KEY`.</p>
        </section>
      </main>
    );
  }

  const { rankingSource } = colleges[0];

  return (
    <main>
      <CollegeExplorer colleges={colleges} fetchedAt={rankingSource.fetchedAt} rankingSource={rankingSource} />
    </main>
  );
}
