const source = (process.env.RANKING_SOURCE || "forbes").toLowerCase();

async function main() {
  if (source === "usnews" || source === "us-news") {
    try {
      const { fetchUsNewsTop50 } = await import("./fetch-usnews-top50");
      await fetchUsNewsTop50();
      return;
    } catch (error) {
      console.warn("US News fetch failed. Falling back to Forbes for this run.");
      console.warn(error);
      const { fetchForbesTop50 } = await import("./fetch-forbes-top50");
      await fetchForbesTop50();
      return;
    }
  }

  const { fetchForbesTop50 } = await import("./fetch-forbes-top50");
  await fetchForbesTop50();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
