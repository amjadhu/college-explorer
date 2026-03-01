const source = (process.env.RANKING_SOURCE || "forbes").toLowerCase();

async function main() {
  if (source === "usnews" || source === "us-news") {
    try {
      const { fetchUsNewsTop50 } = await import("./fetch-usnews-top50");
      await fetchUsNewsTop50();
      console.log("Ranking source used: U.S. News Best Colleges (primary).");
      return;
    } catch (error) {
      console.warn("US News fetch failed. Falling back to Forbes for this run.");
      console.warn(error);
      const { fetchForbesTop50 } = await import("./fetch-forbes-top50");
      await fetchForbesTop50({ fallbackFrom: "usnews" });
      console.log("Ranking source used: Forbes Top Colleges (fallback from usnews).");
      return;
    }
  }

  const { fetchForbesTop50 } = await import("./fetch-forbes-top50");
  await fetchForbesTop50();
  console.log("Ranking source used: Forbes Top Colleges (primary).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
