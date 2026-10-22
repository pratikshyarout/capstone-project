/**
 * Capture a full-page screenshot of the dashboard.
 * Usage: node scripts/screenshot.js
 */
const puppeteer = require("puppeteer-core");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
  await page.goto("http://localhost:3457", {
    waitUntil: "networkidle0",
    timeout: 15000,
  });

  // Wait for fonts and animations to settle
  await new Promise((r) => setTimeout(r, 2000));

  const outPath = path.join(__dirname, "..", "assets", "dashboard-preview.png");
  await page.screenshot({ path: outPath, fullPage: true });
  console.log("Screenshot saved to", outPath);

  await browser.close();
})();
