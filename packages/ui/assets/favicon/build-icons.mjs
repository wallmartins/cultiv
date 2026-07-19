import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const svgDir = join(here, "..", "svg");
const faviconSvg = join(here, "favicon.svg");
const ICON_BACKGROUND = "#121212";
const SELO_RING_SPAN_UNITS = 79;
const SELO_VIEWBOX_CENTER = 48;

const stripSvgWrapper = (markup) => markup.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const seloMarkup = stripSvgWrapper(readFileSync(join(svgDir, "icon-dark-bg.svg"), "utf8"));

function renderSeloOnBackground(canvasSize, seloRingWidthPx, filename) {
  const scale = seloRingWidthPx / SELO_RING_SPAN_UNITS;
  const offset = canvasSize / 2 - SELO_VIEWBOX_CENTER * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}"><rect width="${canvasSize}" height="${canvasSize}" fill="${ICON_BACKGROUND}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${seloMarkup}</g></svg>`;
  const tmpPath = join(here, `.tmp-${filename}.svg`);
  writeFileSync(tmpPath, svg);
  execFileSync("resvg", ["--skip-system-fonts", tmpPath, join(here, filename)]);
  unlinkSync(tmpPath);
}

function renderTransparentFavicon(size, filename) {
  execFileSync("resvg", ["--skip-system-fonts", "-w", String(size), "-h", String(size), faviconSvg, join(here, filename)]);
}

const MASKABLE_SELO_WIDTH = 262;
renderSeloOnBackground(180, 120, "apple-touch-icon.png");
renderSeloOnBackground(192, 128, "icon-192.png");
renderSeloOnBackground(512, 350, "icon-512.png");
renderSeloOnBackground(512, MASKABLE_SELO_WIDTH, "icon-maskable-512.png");
renderTransparentFavicon(16, "favicon-16.png");
renderTransparentFavicon(32, "favicon-32.png");
renderTransparentFavicon(48, "favicon-48.png");

execFileSync("magick", [
  join(here, "favicon-16.png"),
  join(here, "favicon-32.png"),
  join(here, "favicon-48.png"),
  join(here, "favicon.ico"),
]);

console.log("favicons regenerados dos SVGs (tokens):");
console.log("  apple-touch 180 · icon 192/512 · maskable 512 · favicon 16/32/48 · favicon.ico");
