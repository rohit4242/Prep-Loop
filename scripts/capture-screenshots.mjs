import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const outDir = "docs/screenshots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
await page.screenshot({ path: `${outDir}/landing.png`, fullPage: true });

await page.goto("http://localhost:3000/preview/room", { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
await page.getByRole("button", { name: "speaking" }).click();
await page.locator("[data-agent-state=speaking]").waitFor();
await page.locator("div.flex.gap-2").first().evaluate((el) => {
  el.style.display = "none";
});
await page.screenshot({ path: `${outDir}/interview-room.png`, fullPage: true });

await browser.close();
console.log("Wrote landing and interview-room screenshots");
