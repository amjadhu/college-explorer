import { pathToFileURL } from "node:url";
import { slugify, writeRankingData } from "./lib";

const DEFAULT_FORBES_URL = "https://www.forbes.com/top-colleges/";
const FORBES_LIST_API = "https://www.forbes.com/lists-api/getListData";

const encode = (value: string | number): string => Buffer.from(String(value), "utf-8").toString("base64");

export async function fetchForbesTop50(options?: { fallbackFrom?: string }) {
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
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nextDataMatch) {
    throw new Error("Could not locate __NEXT_DATA__ on Forbes page.");
  }

  const nextData = JSON.parse(nextDataMatch[1]) as {
    props?: {
      pageProps?: {
        schema?: {
          year?: number;
          listUri?: string;
          sections?: Array<{
            componentId?: string;
            props?: {
              filters?: { dropdowns?: Array<{ accessor: string }> };
              searchFilterKey?: string[];
              tableConfig?: { initialSort?: { key?: string; direction?: string } };
            };
          }>;
        };
      };
    };
  };

  const schema = nextData.props?.pageProps?.schema;
  const year = schema?.year ?? new Date().getUTCFullYear();
  const listUri = schema?.listUri ?? "top-colleges";
  const tableSection = schema?.sections?.find((section) => section.componentId === "Table");
  const searchKey = tableSection?.props?.searchFilterKey?.join(",") || "organizationName";
  const filterFields =
    tableSection?.props?.filters?.dropdowns?.map((dropdown) => dropdown.accessor).join(",") ||
    "campusSetting,state,schoolSize";
  const sortBy = tableSection?.props?.tableConfig?.initialSort?.key || "rank";
  const sortOrder = tableSection?.props?.tableConfig?.initialSort?.direction?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const listApiUrl = `${FORBES_LIST_API}?${new URLSearchParams({
    listUri: encode(listUri),
    year: encode(year),
    limit: encode(50),
    sortBy: encode(sortBy),
    sortOrder: encode(sortOrder),
    search: encode(""),
    searchKey: encode(searchKey),
    offset: encode(0),
    filter: encode(""),
    filterFields: encode(filterFields)
  }).toString()}`;

  const listRes = await fetch(listApiUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    }
  });

  if (!listRes.ok) {
    throw new Error(`Could not fetch Forbes list API (${listRes.status} ${listRes.statusText}).`);
  }

  const payload = (await listRes.json()) as {
    data?: Array<{ rank?: string | number; organizationName?: string }>;
  };

  const top50 = (payload.data ?? [])
    .map((item) => {
      const rank = Number(item.rank);
      const name = item.organizationName?.trim();
      if (!rank || !name) return null;
      return { rank, name, slug: slugify(name) };
    })
    .filter((item): item is { rank: number; name: string; slug: string } => Boolean(item))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 50);

  if (top50.length < 50) {
    throw new Error(`Forbes list API returned only ${top50.length} colleges. Expected 50.`);
  }

  await writeRankingData({
    source: {
      name: "Forbes Top Colleges",
      url,
      fetchedAt: new Date().toISOString(),
      fallbackUsed: Boolean(options?.fallbackFrom),
      fallbackFrom: options?.fallbackFrom
    },
    colleges: top50
  });

  console.log(`Saved Forbes top ${top50.length} colleges from ${url}.`);
}

const isDirectRun = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  fetchForbesTop50().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
