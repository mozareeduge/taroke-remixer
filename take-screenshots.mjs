import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync } from "fs";
import { resolve } from "path";

const NEXT_DIR = "/home/user/taroke-remixer/next";
const OUT_DIR = "/home/user/taroke-remixer/docs/v08/screenshots";

function serveFile(req, res) {
  let path = req.url === "/" ? "/index.html" : req.url;
  const filePath = resolve(NEXT_DIR, "." + path);
  try {
    const data = readFileSync(filePath);
    const ext = path.split(".").pop();
    const mime = { html: "text/html", js: "application/javascript", css: "text/css" }[ext] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}

const server = createServer(serveFile);
await new Promise((r) => server.listen(9876, r));
console.log("Server on :9876");

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-landscape-844", width: 844, height: 390 },
];

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto("http://localhost:9876/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const path = `${OUT_DIR}/${vp.name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`Captured ${vp.name}`);
  await page.close();
}

await browser.close();
server.close();
console.log("All screenshots done.");
