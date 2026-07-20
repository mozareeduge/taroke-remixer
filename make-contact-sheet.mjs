import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const SHOTS_DIR = "/home/user/taroke-remixer/docs/v08/screenshots";
const OUT = `${SHOTS_DIR}/final-experience-contact-sheet.png`;

const shots = [
  { file: "desktop-1440.png", label: "1440×900 desktop" },
  { file: "desktop-1024.png", label: "1024×768 desktop" },
  { file: "mobile-390.png", label: "390×844 mobile portrait" },
  { file: "mobile-landscape-844.png", label: "844×390 mobile landscape" },
];

// Convert each image to a data URL for injection into the browser
const images = shots.map((s) => {
  const data = readFileSync(`${SHOTS_DIR}/${s.file}`);
  return { label: s.label, dataUrl: `data:image/png;base64,${data.toString("base64")}` };
});

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

const COLS = 2;
const THUMB_W = 720;
const THUMB_H = 450;
const PAD = 12;
const LABEL_H = 24;

const totalW = COLS * THUMB_W + (COLS + 1) * PAD;
const rows = Math.ceil(shots.length / COLS);
const totalH = rows * (THUMB_H + LABEL_H) + (rows + 1) * PAD;

await page.setViewportSize({ width: totalW, height: totalH });
await page.setContent(`<html><body style="margin:0;padding:0;background:#050604"><canvas id="c" width="${totalW}" height="${totalH}"></canvas></body></html>`);

const pngDataUrl = await page.evaluate(async ({ images, totalW, totalH, COLS, THUMB_W, THUMB_H, PAD, LABEL_H }) => {
  const canvas = document.getElementById("c");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050604";
  ctx.fillRect(0, 0, totalW, totalH);

  for (let i = 0; i < images.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (THUMB_W + PAD);
    const y = PAD + row * (THUMB_H + LABEL_H + PAD);

    const img = await new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.src = images[i].dataUrl;
    });

    const scale = Math.min(THUMB_W / img.width, THUMB_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (THUMB_W - dw) / 2;
    const dy = y + (THUMB_H - dh) / 2;
    ctx.fillStyle = "#111";
    ctx.fillRect(x, y, THUMB_W, THUMB_H);
    ctx.drawImage(img, dx, dy, dw, dh);

    ctx.fillStyle = "#eee6d2";
    ctx.font = "bold 13px monospace";
    ctx.textBaseline = "middle";
    ctx.fillText(images[i].label, x + 4, y + THUMB_H + LABEL_H / 2);
  }

  return canvas.toDataURL("image/png");
}, { images, totalW, totalH, COLS, THUMB_W, THUMB_H, PAD, LABEL_H });

const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, "");
writeFileSync(OUT, Buffer.from(base64Data, "base64"));
console.log(`Contact sheet written: ${OUT}`);

await browser.close();
