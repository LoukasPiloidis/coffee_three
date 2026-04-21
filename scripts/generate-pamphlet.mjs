#!/usr/bin/env node
/**
 * Generates the marketing pamphlet HTML with an embedded QR code and logo.
 *
 * Usage:
 *   node scripts/generate-pamphlet.mjs
 *
 * Output: marketing/pamphlet.html (ready to open in browser → Print → Save as PDF)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import QRCode from "qrcode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

async function main() {
  // 1. Generate QR code SVG
  const qrSvg = await QRCode.toString("https://coffeethree.gr", {
    type: "svg",
    width: 180,
    margin: 0,
    color: { dark: "#1f3328", light: "#faf6ec" },
  });

  // 2. Encode logo as base64
  const logoBuffer = readFileSync(join(ROOT, "public/logo.jpeg"));
  const logoBase64 = logoBuffer.toString("base64");

  // 3. Read template and inject
  const template = readFileSync(
    join(ROOT, "marketing/pamphlet-template.html"),
    "utf-8"
  );

  const html = template
    .replace("{{QR_CODE}}", qrSvg)
    .replace("{{LOGO_BASE64}}", logoBase64);

  const outPath = join(ROOT, "marketing/pamphlet.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`✓ Generated ${outPath}`);
  console.log(
    "  Open in browser → Print → Save as PDF (A5, no margins, background graphics ON)"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
