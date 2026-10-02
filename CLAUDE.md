# College Compass — Project Context

## What This Is
A personalized college intelligence tool for families, built as a Next.js 15 static export deployed to GitHub Pages. Transforms raw College Scorecard + ranking data into actionable insights with a 7-dimension Family Score engine.

## Architecture

### Data Pipeline (`scripts/`)
- `fetch-rankings.ts` → `fetch-forbes-top50.ts` / `fetch-usnews-top50.ts` → `enrich-scorecard.ts` → `build-dataset.ts`
- `lookup-tables.ts` — Carnegie/religious code-to-label maps
- `majors.ts` — 27 program fields with `extractTopMajors()` and `extractAllMajors()`
- Pipeline run: `npm run data:refresh` (requires `COLLEGE_SCORECARD_API_KEY`)
- Output: `data/top50-colleges.json`

### Core Library (`src/lib/`)
- `types.ts` — `CollegeRecord` (50+ fields), `FamilyPreferences`, `WorkspaceState`, `DimensionKey`, `Filters`
- `scoring.ts` — 7-dimension Family Score (0-100) with percentile normalization
- `narrative.ts` — deterministic text: `interpretStat()`, `generateStrengths()`, `generateConcerns()`
- `context-bands.ts` — threshold bands for 9 stat types ("Extremely selective" → "Accessible")
- `percentiles.ts`, `distance.ts` — math utilities
- `preferences-storage.ts` — localStorage (`college-compass:preferences:v1`)
- `workspace-storage.ts` — localStorage (`college-compass:workspace:v1`), migrates from old shortlist
- `compare.ts` — 10 comparison metrics + `generateTradeoffs()`
- `explorer.ts` — filtering with SAT range and size buckets

### Pages & Components (`src/app/`)
- `/` — `discovery-dashboard.tsx` with `preferences-modal.tsx`, `match-card.tsx`, `insight-strip.tsx`, `dimension-explorer.tsx`
- `/colleges/[slug]` — `school-briefing.tsx` (client) with `stat-with-context.tsx`, `radar-chart.tsx` (pure SVG), `peer-comparison.tsx`
- `/compare` — `comparison-view.tsx` with radar overlays + trade-off summaries
- `/workspace` — `workspace-panel.tsx`, `workspace-entry.tsx`, `status-pipeline.tsx`, `notes-editor.tsx`
- `college-map-canvas.tsx` / `college-map-panel.tsx` — Leaflet map (kept from original)

### Scoring Dimensions
1. Academic Rigor (admission rate, SAT, retention, graduation)
2. Career Outcomes (earnings, graduation, loan default rate)
3. Financial Value (net price, debt, aid, earnings)
4. Safety & Wellbeing (crime rate, retention, student-faculty ratio)
5. Campus Life & Culture (enrollment, part-time share, student-faculty ratio)
6. Location & Environment (distance from home via Haversine)
7. Program Strength (interest-matched major shares)

## Commands
- `npm run dev` — dev server
- `npm run build` — static export (requires data file)
- `npm run test:unit` — 24 tests via Node test runner
- `npm run typecheck` — tsc --noEmit
- `npm run data:refresh` — full pipeline

## Design System
- Fonts: DM Sans (body), Space Grotesk (headings)
- Colors: `--brand: #1c5560` (teal), `--accent: #c5663f` (coral), `--bg: #f2ede5` (warm beige)
- All CSS in `globals.css` — no CSS modules or Tailwind

## Deploy
- GitHub Pages via `.github/workflows/deploy-pages.yml`
- Auto-deploys on push to main
- Live data refresh included in CI
