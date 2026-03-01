# College Compass

College Compass is a static Next.js app for students and parents to explore top colleges, narrow options, save a shortlist, and compare tradeoffs with transparent real-world data.

## V2 highlights

- Exploration-first interface with fast filtering and card/list views
- Persistent shortlist (saved in browser localStorage)
- Side-by-side compare drawer for up to 4 colleges with best/caution highlights
- Interactive map lens with setting color coding (city/suburb/town/rural)
- Rich detail pages with admissions, costs, outcomes, and top major strength chips
- High transparency UI: ranking source, refresh date, and metric coverage badges

## Data pipeline

No seeded sample data. Dataset is built from live ranking + College Scorecard sources.

- `scripts/fetch-rankings.ts`: ranking orchestrator
- `scripts/fetch-usnews-top50.ts`: U.S. News source adapter
- `scripts/fetch-forbes-top50.ts`: Forbes source adapter
- `scripts/enrich-scorecard.ts`: enriches ranked schools with College Scorecard fields
- `scripts/build-dataset.ts`: writes final `data/top50-colleges.json`

Ranking behavior:

- `RANKING_SOURCE=usnews`: tries U.S. News first, falls back to Forbes if needed
- `RANKING_SOURCE=forbes`: uses Forbes directly

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Add keys/variables:

```bash
COLLEGE_SCORECARD_API_KEY=your_key_here
RANKING_SOURCE=forbes
FORBES_RANKING_URL=https://www.forbes.com/top-colleges/
USNEWS_RANKING_URL=https://www.usnews.com/best-colleges/rankings/national-universities
```

## Commands

```bash
npm run data:rankings   # ranking source refresh
npm run data:scorecard  # scorecard enrichment
npm run data:build      # final dataset build
npm run data:refresh    # full pipeline
npm run test:unit       # unit tests
npm run typecheck       # typescript check
npm run build           # production static export build
npm run dev             # local development
```

## GitHub Pages deploy

1. Repo settings -> **Pages** -> Source: **GitHub Actions**
2. Repo settings -> **Secrets and variables** -> **Actions**:
   - Secret: `COLLEGE_SCORECARD_API_KEY`
   - Optional variables: `RANKING_SOURCE`, `FORBES_RANKING_URL`, `USNEWS_RANKING_URL`
3. Push to `main` to trigger deploy workflow

Site URL format:

- `https://<github-username>.github.io/<repo-name>/`

## Notes

- If ranking site markup/endpoints change, update source adapter scripts.
- College Scorecard name matching is fuzzy and may need occasional manual verification.
- If the scorecard key is missing, enrichment gracefully writes ranking-only data.
