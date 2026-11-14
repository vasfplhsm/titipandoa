// Original vector artwork is rasterized locally. No external images are fetched.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const svg = fs.readFileSync("public/icons/icon.svg", "utf8");
    for (const [name, size] of [
      ["icon-192.png", 192],
      ["icon-512.png", 512],
      ["apple-touch-icon.png", 180],
      ["icon-maskable.png", 512],
    ]) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<style>body{margin:0}svg{width:100%;height:100%;display:block}</style>${name === "icon-maskable.png" ? svg.replace('rx="110"', 'rx="0"') : svg}`,
      );
      await page.screenshot({ path: "public/icons/" + name });
    }
    const nativeIcon = "ios/TitipanDoa/App/Assets.xcassets/AppIcon.appiconset";
    fs.mkdirSync(nativeIcon, { recursive: true });
    await page.setViewportSize({ width: 1024, height: 1024 });
    await page.setContent(
      `<style>body{margin:0}svg{width:100%;height:100%;display:block}</style>${svg.replace('rx="110"', 'rx="0"')}`,
    );
    await page.screenshot({ path: nativeIcon + "/AppIcon.png" });
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(
      "<style>body{margin:0}</style>" +
        fs.readFileSync("public/social-preview.svg", "utf8"),
    );
    await page.screenshot({ path: "public/social-preview.png" });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
