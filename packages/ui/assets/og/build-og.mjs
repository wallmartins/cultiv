import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..", "..");

const WORDMARK = "Cultiv";
const SLOGAN = "Escreve como você pensa.";
const WIDTH = 1200;
const HEIGHT = 630;

function oklchToHex(L, C, h) {
  const hueRadians = (h * Math.PI) / 180;
  const a = C * Math.cos(hueRadians);
  const b = C * Math.sin(hueRadians);
  const lRoot = L + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = L - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = L - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3, m = mRoot ** 3, s = sRoot ** 3;
  const linearRgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const gammaEncode = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  const toHexByte = (x) => Math.max(0, Math.min(255, Math.round(gammaEncode(x) * 255))).toString(16).padStart(2, "0");
  return "#" + linearRgb.map(toHexByte).join("");
}

const KNOWN_LIGHT_ACCENT_HEX = "#a3dd42";
if (oklchToHex(0.83, 0.19, 128) !== KNOWN_LIGHT_ACCENT_HEX) {
  throw new Error(`oklchToHex regression: got ${oklchToHex(0.83, 0.19, 128)}, expected ${KNOWN_LIGHT_ACCENT_HEX}`);
}

const tokensCss = readFileSync(join(packageRoot, "src", "tokens.css"), "utf8");
const darkTokenBlock = tokensCss.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1];
if (!darkTokenBlock) throw new Error('tokens.css is missing the [data-theme="dark"] block');

function darkTokenHex(name) {
  const declaration = darkTokenBlock.match(new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`));
  if (!declaration) throw new Error(`--${name} oklch token not found in the dark block`);
  const [L, C, h] = declaration[1].trim().split(/\s+/).map(Number);
  return oklchToHex(L, C, h);
}
const bg = darkTokenHex("bg");
const ink = darkTokenHex("ink");
const muted = darkTokenHex("muted");
const accent = darkTokenHex("accent");

const stripSvgWrapper = (markup) => markup.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const repaintWithDarkTokens = (markup) => markup.replace(/#e8e8e8/gi, ink).replace(/#abe841/gi, accent);
const seloMarkup = repaintWithDarkTokens(
  stripSvgWrapper(readFileSync(join(packageRoot, "assets", "svg", "icon-dark-bg.svg"), "utf8"))
);

const seloSize = 150;
const seloX = (WIDTH - seloSize) / 2;
const seloY = 150;
const wordmarkSize = 104;
const wordmarkBaseline = 430;
const sloganSize = 33;
const sloganBaseline = 486;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${bg}"/>
  <g transform="translate(${seloX} ${seloY}) scale(${seloSize / 96})">${seloMarkup}</g>
  <text x="${WIDTH / 2}" y="${wordmarkBaseline}" text-anchor="middle" fill="${ink}"
        font-family="Instrument Serif" font-size="${wordmarkSize}">${WORDMARK}</text>
  <text x="${WIDTH / 2}" y="${sloganBaseline}" text-anchor="middle" fill="${muted}"
        font-family="Instrument Serif" font-size="${sloganSize}" letter-spacing="0.4">${SLOGAN}</text>
</svg>
`;

const svgPath = join(here, "og-image.svg");
const pngPath = join(here, "og-image.png");
const localInstrumentSerif = join(here, "InstrumentSerif-Regular.ttf");
writeFileSync(svgPath, svg);

execFileSync("resvg", ["--skip-system-fonts", "--use-font-file", localInstrumentSerif, svgPath, pngPath], {
  stdio: "inherit",
});

console.log(`og-image gerado ${WIDTH}x${HEIGHT}`);
console.log(`  bg ${bg}  ink ${ink}  muted ${muted}  accent ${accent}`);
console.log(`  "${WORDMARK}" · "${SLOGAN}"`);
