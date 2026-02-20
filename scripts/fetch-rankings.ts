const source = (process.env.RANKING_SOURCE || "forbes").toLowerCase();

async function main() {
  if (source === "usnews" || source === "us-news") {
    try {
      await import("./fetch-usnews-top50");
      return;
    } catch (error) {
      console.warn("US News fetch failed. Falling back to Forbes for this run.");
      console.warn(error);
      await import("./fetch-forbes-top50");
      return;
    }
  }

  await import("./fetch-forbes-top50");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
