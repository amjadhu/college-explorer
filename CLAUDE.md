# College Compass — Project Context

## What This Is
An AI-powered college intelligence tool for families, built with Next.js 15 on Vercel. Combines College Scorecard data (including program-level earnings/debt) with Claude AI briefings to deliver personalized, honest school analysis. Differentiator: program-level earnings/debt data + AI interpretation.

## Architecture

### Data Pipeline (`scripts/`)
- `fetch-rankings.ts` → `fetch-forbes-top75.ts` / `fetch-usnews-top75.ts` → `enrich-scorecard.ts` → `build-dataset.ts`
- `enrich-scorecard.ts` — fetches school data + `latest.programs.cip_4_digit` for program-level earnings/debt
- `majors.ts` — 27 program fields with CIP code prefixes, `extractTopMajors()` and `extractAllMajors()` now include `medianEarnings` and `medianDebt`
- `lookup-tables.ts` — Carnegie/religious code-to-label maps
- Pipeline run: `npm run data:refresh` (requires `COLLEGE_SCORECARD_API_KEY`)
- Output: `data/top75-colleges.json`

### Database (Turso + Drizzle)
- `src/lib/db/schema.ts` — `college_briefings` table (id, slug, briefing_data JSON, model, generated_at)
- `src/lib/db/client.ts` — Drizzle ORM client with libsql
- `drizzle.config.ts` — Drizzle Kit config (SQLite dialect)
- Local dev: `file:local.db`, Production: Turso cloud DB

### AI Briefing System (`src/app/actions/`)
- `briefing.ts` — Server action `generateCollegeBriefing()` calls Claude Haiku with school stats + program-level data + family preferences + peer comparison context. Rate limited to 20/day.
- `briefing-helpers.ts` — `getBriefing()`, `getBriefingsRemaining()`, `getBriefingsForSlugs()` for DB queries
- Output schema: `CollegeBriefingData` (verdict, oneLiner, fitAnalysis, programInsight, costReality, strengths, risks, bottomLine)

### Core Library (`src/lib/`)
- `types.ts` — `CollegeRecord` (50+ fields), `MajorShare` (now with `medianEarnings`, `medianDebt`), `FamilyPreferences`, `WorkspaceState`, `DimensionKey`, `Filters`
- `scoring.ts` — 7-dimension Family Score (0-100) with percentile normalization
- `narrative.ts` — deterministic text fallback: `interpretStat()`, `generateStrengths()`, `generateConcerns()`
- `context-bands.ts` — threshold bands for 9 stat types
- `percentiles.ts`, `distance.ts` — math utilities
- `preferences-storage.ts` — localStorage (`college-compass:preferences:v1`)
- `workspace-storage.ts` — localStorage (`college-compass:workspace:v1`)
- `compare.ts` — 10 comparison metrics + `generateTradeoffs()`
- `explorer.ts` — filtering with SAT range and size buckets

### Pages & Components (`src/app/`)
- `/` — `discovery-dashboard.tsx` with `preferences-modal.tsx` (3 priority toggles), `match-card.tsx` (verdict + key numbers + program match)
- `/colleges/[slug]` — Dynamic server component with `college-briefing.tsx` (AI) + `school-briefing.tsx` (deterministic fallback) + `stat-with-context.tsx`, `radar-chart.tsx`, `peer-comparison.tsx`
- `/compare` — `comparison-view.tsx` with radar overlays + trade-off summaries
- `/workspace` — `workspace-panel.tsx`, `workspace-entry.tsx`, `status-pipeline.tsx`, `notes-editor.tsx`
- `college-map-canvas.tsx` / `college-map-panel.tsx` — Leaflet map
- `nav-workspace-link.tsx` — Navigation workspace indicator

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
- `npm run build` — Next.js build (server-rendered, not static export)
- `npm run test:unit` — tests via Node test runner
- `npm run typecheck` — tsc --noEmit
- `npm run data:refresh` — full pipeline (requires `COLLEGE_SCORECARD_API_KEY` env var, use `RANKING_SOURCE=usnews` prefix)
- `npm run db:push` — push schema to database
- `npm run db:generate` — generate migrations

## Environment Variables
- `COLLEGE_SCORECARD_API_KEY` — for data pipeline
- `ANTHROPIC_API_KEY` — for AI briefings (Claude Haiku)
- `DATABASE_URL` — Turso DB URL (or `file:local.db` for local)
- `DATABASE_AUTH_TOKEN` — Turso auth token

## Design System
- Fonts: DM Sans (body), Space Grotesk (headings)
- Colors: `--brand: #1c5560` (teal), `--accent: #c5663f` (coral), `--bg: #f2ede5` (warm beige)
- All CSS in `globals.css` — no CSS modules or Tailwind

## Security
- HTTP security headers configured in `next.config.ts` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-DNS-Prefetch-Control, HSTS)
- No CSP header — Leaflet and inline canvas scripts would need careful whitelisting
- Server action input validation in `briefing.ts`: slug regex, preferences weights/interests type checks
- Rate-limit queries use proper `gte`/`lt` date ranges (not `LIKE` string concatenation)
- `JSON.parse` of AI output wrapped in try-catch
- `.env.local` should only contain `COLLEGE_SCORECARD_API_KEY` (no Vercel OIDC tokens)

## Responsive Design
- Breakpoints: 1080px (sidebar collapses), 980px (grids stack), 640px (mobile)
- All interactive elements get 44px min-height touch targets at ≤640px
- Radar chart SVG uses `width="100%"` + `viewBox` for responsive scaling
- Viz tabs horizontally scroll (not wrap) on mobile
- Two `@media` blocks in `globals.css` — do not duplicate (previously had duplicate 980px and 640px blocks)

## Deploy
- Vercel (connected to `amjadhu/college-explorer` repo)
- Production URL: https://colleges.amjadhu.com (also https://college-explorer-theta.vercel.app)
- Server actions enabled for AI briefing generation
- Environment variables configured in Vercel dashboard
- Turso DB: `college-compass` (libsql://college-compass-famshuss.aws-us-west-2.turso.io)
- Data file (`data/top75-colleges.json`) is committed to repo — Vercel builds don't run the data pipeline
- `drizzle.config.ts` uses dialect `"turso"` with `authToken` in dbCredentials
