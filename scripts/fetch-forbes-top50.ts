import { load } from "cheerio";
import { slugify, writeForbesData } from "./lib";

const DEFAULT_FORBES_URL = "https://www.forbes.com/top-colleges/";

const rankItemFromText = (text: string) => {
  const match = text.match(/^\s*(\d{1,3})\.?\s+(.+)$/);
  if (!match) return null;
  const rank = Number(match[1]);
  const name = match[2].trim();
  if (!rank || !name) return null;
  return { rank, name, slug: slugify(name) };
};

async function main() {
  const url = process.env.FORBES_RANKING_URL || DEFAULT_FORBES_URL;
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    }
  });

  if (!res.ok) {
    throw new Error(`Could not fetch Forbes page (${res.status} ${res.statusText}).`);
  }

  const html = await res.text();
  const $ = load(html);

  const byJsonLd: Array<{ rank: number; name: string; slug: string }> = [];

  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).text();
    if (!raw) return;

    try {
      const json = JSON.parse(raw);
      const candidates = Array.isArray(json) ? json : [json];
      for (const candidate of candidates) {
        const list = candidate?.itemListElement;
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          const rank = Number(item?.position);
          const name = String(item?.item?.name ?? item?.name ?? "").trim();
          if (!rank || !name) continue;
          byJsonLd.push({ rank, name, slug: slugify(name) });
        }
      }
    } catch {
      // Ignore parse failures for unrelated scripts.
    }
  });

  let extracted = byJsonLd;

  if (extracted.length < 50) {
    const byRows: Array<{ rank: number; name: string; slug: string }> = [];
    $("tr, li, div").each((_, el) => {
      const text = $(el).text().trim();
      if (!text) return;
      const maybe = rankItemFromText(text);
      if (maybe && maybe.rank <= 200) byRows.push(maybe);
    });

    const deduped = new Map<number, { rank: number; name: string; slug: string }>();
    for (const item of byRows) {
      if (!deduped.has(item.rank)) deduped.set(item.rank, item);
    }
    extracted = [...deduped.values()];
  }

  const top50 = extracted
    .filter((x) => x.rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 50);

  if (top50.length < 50) {
    throw new Error(
      `Only extracted ${top50.length} ranked colleges. Forbes markup likely changed. Update parser in scripts/fetch-forbes-top50.ts.`
    );
  }

  await writeForbesData({
    source: {
      name: "Forbes Top Colleges",
      url,
      fetchedAt: new Date().toISOString()
    },
    colleges: top50
  });

  console.log(`Saved Forbes top ${top50.length} colleges from ${url}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
