const source = (process.env.RANKING_SOURCE || "forbes").toLowerCase();

async function main() {
  if (source === "usnews" || source === "us-news") {
    try {
      const { fetchUsNewsTop75 } = await import("./fetch-usnews-top75");
      await fetchUsNewsTop75();
      console.log("Ranking source used: U.S. News Best Colleges (primary).");
      return;
    } catch (error) {
      console.warn("US News fetch failed. Falling back to Forbes for this run.");
      console.warn(error);
      const { fetchForbesTop75 } = await import("./fetch-forbes-top75");
      await fetchForbesTop75({ fallbackFrom: "usnews" });
      console.log("Ranking source used: Forbes Top Colleges (fallback from usnews).");
      return;
    }
  }

  const { fetchForbesTop75 } = await import("./fetch-forbes-top75");
  await fetchForbesTop75();
  console.log("Ranking source used: Forbes Top Colleges (primary).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
