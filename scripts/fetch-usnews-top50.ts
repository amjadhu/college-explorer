import { slugify, writeRankingData } from "./lib";

const DEFAULT_USNEWS_URL = "https://www.usnews.com/best-colleges/rankings/national-universities";
const USNEWS_SEARCH_API = "https://www.usnews.com/best-colleges/api/search?format=json";

const parseSchoolTypeFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).at(-1);
    return last || "national-universities";
  } catch {
    return "national-universities";
  }
};

const rankFromDisplay = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const m = value.match(/\d+/);
  return m ? Number(m[0]) : null;
};

type UsNewsItem = {
  institution?: {
    displayName?: string;
    linkedDisplayName?: string;
    rankingDisplayRank?: string | number;
    rankingSortRank?: number;
  };
  ranking?: {
    displayRank?: string | number;
    sortRank?: number;
  };
};

type UsNewsSearchResponse = {
  data?: {
    items?: UsNewsItem[];
    next_link?: string | null;
  };
};

async function fetchPage(url: string): Promise<UsNewsSearchResponse> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          accept: "application/json"
        },
        signal: controller.signal
      });

      if (!res.ok) {
        if ((res.status >= 500 || res.status === 429) && attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 600));
          continue;
        }
        throw new Error(`US News search API failed (${res.status} ${res.statusText}) for ${url}.`);
      }

      return (await res.json()) as UsNewsSearchResponse;
    } catch (error) {
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 800));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error(`US News search API failed after retries for ${url}.`);
}

async function main() {
  const url = process.env.USNEWS_RANKING_URL || DEFAULT_USNEWS_URL;
  const schoolType = parseSchoolTypeFromUrl(url);
  let nextUrl = `${USNEWS_SEARCH_API}&${new URLSearchParams({
    schoolType,
    sort: "rank"
  }).toString()}`;

  const all: Array<{ rank: number; name: string; slug: string }> = [];
  const seenNames = new Set<string>();

  for (let iteration = 0; iteration < 12 && all.length < 50 && nextUrl; iteration += 1) {
    const payload = await fetchPage(nextUrl);
    const items = payload.data?.items ?? [];
    nextUrl = payload.data?.next_link ?? "";
    if (!items.length) break;

    for (const item of items) {
      const name = (item.institution?.displayName || item.institution?.linkedDisplayName || "").trim();
      const rank =
        rankFromDisplay(item.ranking?.displayRank) ??
        rankFromDisplay(item.institution?.rankingDisplayRank) ??
        item.ranking?.sortRank ??
        item.institution?.rankingSortRank ??
        null;

      if (!name || !rank) continue;

      const key = name.toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);

      all.push({ rank, name, slug: slugify(name) });
      if (all.length >= 50) break;
    }
  }

  const top50 = all
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .slice(0, 50)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  if (top50.length < 50) {
    throw new Error(`US News API yielded only ${top50.length} ranked colleges. Expected 50.`);
  }

  await writeRankingData({
    source: {
      name: "U.S. News Best Colleges",
      url,
      fetchedAt: new Date().toISOString()
    },
    colleges: top50
  });

  console.log(`Saved U.S. News top ${top50.length} colleges from ${url}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
