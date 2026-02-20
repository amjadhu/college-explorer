# College Compass

A Next.js web app for high-school students to explore the top 50 colleges with real data from the U.S. Department of Education College Scorecard API.

## What this app includes

- Search + filter across the current top 50 list
- College detail pages with admissions, cost, outcomes, and location context
- Data pipeline (no seeded sample data)
  - `scripts/fetch-rankings.ts`: pulls top 50 from selected ranking source
  - `scripts/fetch-forbes-top50.ts`: Forbes source adapter
  - `scripts/fetch-usnews-top50.ts`: U.S. News source adapter
  - `scripts/enrich-scorecard.ts`: maps each school to College Scorecard data
  - `scripts/build-dataset.ts`: writes final `data/top50-colleges.json`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Add API key to `.env.local`:

```bash
COLLEGE_SCORECARD_API_KEY=your_key_here
RANKING_SOURCE=forbes
FORBES_RANKING_URL=https://www.forbes.com/top-colleges/
USNEWS_RANKING_URL=https://www.usnews.com/best-colleges/rankings/national-universities
```

`RANKING_SOURCE` options:

- `forbes` (default)
- `usnews`

## Refresh data

```bash
npm run data:refresh
```

This creates:

- `data/raw/ranking-top50.json`
- `data/raw/scorecard-enriched.json`
- `data/top50-colleges.json`

## Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## MVP hosting on GitHub Pages

1. Create a new GitHub repo and push this folder to `main`.
2. In GitHub repo settings:
   - `Settings -> Pages -> Source`: select **GitHub Actions**.
   - `Settings -> Secrets and variables -> Actions -> Secrets`: add `COLLEGE_SCORECARD_API_KEY`.
   - Optional: `Settings -> Secrets and variables -> Actions -> Variables`:
     - `RANKING_SOURCE` (`forbes` or `usnews`)
     - `FORBES_RANKING_URL` (defaults to `https://www.forbes.com/top-colleges/`)
     - `USNEWS_RANKING_URL` (defaults to `https://www.usnews.com/best-colleges/rankings/national-universities`)
3. Push to `main` to trigger `.github/workflows/deploy-pages.yml`.
4. Site will be available at:
   - `https://<your-github-username>.github.io/<your-repo-name>/`

This project uses static export and auto-sets the correct base path during GitHub Actions builds.

## Notes

- If Forbes changes page markup, update parsing logic in `scripts/fetch-forbes-top50.ts`.
- If U.S. News changes API/markup, update `scripts/fetch-usnews-top50.ts`.
- College Scorecard matching uses fuzzy scoring by school name; verify edge cases manually.
- Ranking list source and fetch timestamp are shown in the UI for transparency.
