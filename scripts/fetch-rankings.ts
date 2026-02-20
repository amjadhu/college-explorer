const source = (process.env.RANKING_SOURCE || "forbes").toLowerCase();

async function main() {
  if (source === "usnews" || source === "us-news") {
    await import("./fetch-usnews-top50");
    return;
  }

  await import("./fetch-forbes-top50");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
