import { reducedMotion, smoothScrollTo } from "./engine";
import { getLang, onLangChange, type Lang } from "./i18n";

export const DEMO_EXAMPLE_PT =
  "Eu reescrevo tudo. Não por perfeccionismo — por ritmo. Uma frase curta abre espaço; a seguinte estica, respira, dá a volta e só então entrega o que veio entregar. É assim que eu penso, e é assim que eu quero soar. Sabe quando um texto parece falado? Era isso que eu procurava nos meus rascunhos, e quase nunca achava.";

export const DEMO_EXAMPLE_EN =
  "I rewrite everything. Not for perfectionism — for rhythm. A short sentence opens space; the next one stretches, breathes, circles back, and only then delivers what it came to say. Do you know when a piece of writing sounds spoken? That's what I kept chasing in my drafts, and I rarely found it.";

function demoTokens(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}’'-]+/gu) || [];
}

function demoSentences(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").match(/[^.!?…]+[.!?…]*/g) || [];
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (t.length > 1) out.push(t);
  }
  return out;
}

const PT_STOP = [
  "que", "não", "nao", "de", "da", "do", "das", "dos", "uma", "um", "para", "pra", "com", "em", "se", "eu",
  "você", "voce", "mais", "como", "mas", "por", "isso", "é", "são", "já", "está", "tem", "foi", "ele", "ela",
  "os", "as", "ao", "à", "no", "na", "nos", "nas", "quando", "muito", "também", "tambem", "só", "so", "pelo", "pela",
];
const EN_STOP = [
  "the", "and", "you", "that", "of", "is", "to", "it", "in", "was", "for", "on", "are", "with", "they", "this",
  "have", "but", "not", "be", "at", "or", "what", "so", "we", "my", "your", "from", "one", "all", "would", "there",
];

function detectLang(tokens: string[]): Lang {
  let pt = 0;
  let en = 0;
  for (const w of tokens) {
    if (PT_STOP.indexOf(w) !== -1) pt++;
    if (EN_STOP.indexOf(w) !== -1) en++;
  }
  return en > pt ? "en" : "pt";
}

function fallbackLang(tokens: string[], uiLang: Lang): Lang {
  if (tokens.length === 0) return uiLang;
  let pt = 0;
  let en = 0;
  for (const w of tokens) {
    if (PT_STOP.indexOf(w) !== -1) pt++;
    if (EN_STOP.indexOf(w) !== -1) en++;
  }
  if (pt === en) return uiLang;
  return en > pt ? "en" : "pt";
}

const ERROR_COPY = {
  empty: { pt: "Cole ou escreva algo primeiro.", en: "Paste or write something first." },
  short: {
    pt: "Preciso de um pouco mais — umas 40 palavras — pra ler o seu ritmo.",
    en: "I need a bit more — about 40 words — to read your rhythm.",
  },
} as const;

export interface DemoMetric {
  value: string;
  label: string;
}

export type ReadResult =
  | { ok: false; error: string }
  | { ok: true; lines: string[]; metrics: DemoMetric[]; truncated: boolean; lang: Lang };

export function readWriting(raw: string, uiLang: Lang): ReadResult {
  const text = (raw || "").trim();
  if (!text) return { ok: false, error: ERROR_COPY.empty[fallbackLang([], uiLang)] };

  let tokens = demoTokens(text);
  if (tokens.length < 40) return { ok: false, error: ERROR_COPY.short[fallbackLang(tokens, uiLang)] };

  let body = text;
  let truncated = false;
  const rawWords = text.split(/\s+/);
  if (rawWords.length > 400) {
    body = rawWords.slice(0, 400).join(" ");
    truncated = true;
    tokens = demoTokens(body);
  }

  const lang = detectLang(tokens);
  const sents = demoSentences(body);
  const counts: number[] = [];
  for (const sn of sents) {
    const c = demoTokens(sn).length;
    if (c > 0) counts.push(c);
  }
  if (!counts.length) counts.push(tokens.length);
  const n = counts.length;
  const mean = counts.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(counts.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n);
  const cv = sd / Math.max(1, mean);
  const mn = Math.min(...counts);
  const mx = Math.max(...counts);
  const dashes = (body.match(/—|–|--|\s-\s/g) || []).length;
  const semis = (body.match(/;/g) || []).length;
  const parens = (body.match(/\(/g) || []).length;
  const ellips = (body.match(/…|\.\.\./g) || []).length;
  const quests = (body.match(/\?/g) || []).length;
  const seen = new Set<string>();
  for (const w of tokens) seen.add(w);
  const ttr = seen.size / tokens.length;
  const longMin = lang === "pt" ? 8 : 7;
  let longs = 0;
  for (const w of tokens) if (w.length >= longMin) longs++;
  const longPct = longs / tokens.length;
  const PERS =
    lang === "pt"
      ? ["eu", "me", "meu", "minha", "meus", "minhas", "mim", "comigo", "você", "voce", "vocês", "voces", "te", "ti", "teu", "tua", "gente"]
      : ["i", "me", "my", "mine", "myself", "you", "your", "yours", "we", "our", "us"];
  let pers = 0;
  for (const w of tokens) if (PERS.indexOf(w) !== -1) pers++;
  const persRate = (pers / tokens.length) * 100;
  const CONJ =
    lang === "pt"
      ? ["e", "mas", "então", "entao", "aí", "ai", "ou", "porque", "só", "so", "agora", "daí", "dai"]
      : ["and", "but", "so", "then", "or", "because", "now", "plus"];
  let opens = 0;
  for (const sn of sents) {
    const w0 = demoTokens(sn)[0];
    if (w0 && CONJ.indexOf(w0) !== -1) opens++;
  }
  const openRate = opens / n;

  const B =
    lang === "pt"
      ? {
          mean: [17, 5], cv: [0.42, 0.16], dash: [0.05, 0.09], semi: [0.02, 0.05], paren: [0.04, 0.07],
          ellip: [0.03, 0.07], quest: [0.05, 0.09], ttr: [0.66, 0.09], long: [0.24, 0.07], pers: [3.5, 2.8], open: [0.07, 0.09],
        }
      : {
          mean: [16, 5], cv: [0.42, 0.16], dash: [0.04, 0.08], semi: [0.02, 0.05], paren: [0.05, 0.07],
          ellip: [0.03, 0.07], quest: [0.05, 0.09], ttr: [0.62, 0.09], long: [0.18, 0.06], pers: [4, 3], open: [0.09, 0.1],
        };
  const z = (v: number, b: number[]) => (v - b[0]) / b[1];
  const per = (c: number) => Math.max(1, Math.round(n / c));
  const pc = (v: number) => Math.round(v * 100);

  const cand: { z: number; group: string; txt: string }[] = [];
  const push = (zv: number, group: string, txt: string) => {
    if (isFinite(zv)) cand.push({ z: zv, group, txt });
  };

  if (lang === "pt") {
    if (n >= 3) {
      const zc = z(cv, B.cv);
      if (zc >= 0) push(zc, "cad", "Você escreve em rajadas: frases de " + mn + " a " + mx + " palavras — a curta corta, a longa respira.");
      else push(-zc * 0.9, "cad", "Ritmo constante: quase toda frase orbita as " + Math.round(mean) + " palavras. Você escreve no compasso.");
    }
    const zm = z(mean, B.mean);
    push(
      Math.abs(zm) * 0.85,
      "cad",
      zm >= 0
        ? "Fôlego longo: " + Math.round(mean) + " palavras por frase, em média — você confia na frase extensa."
        : "Frases de corte seco: " + Math.round(mean) + " palavras em média. Você não enrola."
    );
    if (dashes > 0) push(z(dashes / n, B.dash), "punct", dashes >= n ? "Travessão em quase toda frase — você pensa em aparte." : "Um travessão a cada " + per(dashes) + " frases — você pensa em aparte.");
    if (semis > 0) push(z(semis / n, B.semi), "punct", "Ponto-e-vírgula de verdade — " + semis + " em " + n + " frases; quase ninguém mais usa.");
    if (parens > 0) push(z(parens / n, B.paren), "punct", "Você abre parênteses (" + parens + (parens > 1 ? " vezes" : " vez") + " aqui) — a voz comenta a própria voz.");
    if (ellips > 0) push(z(ellips / n, B.ellip), "punct", "Reticências a cada " + per(ellips) + " frases… você deixa o pensamento no ar.");
    if (quests > 0) push(z(quests / n, B.quest), "punct", quests + (quests > 1 ? " perguntas" : " pergunta") + " em " + n + " frases — você escreve conversando com o leitor.");
    const zt = z(ttr, B.ttr);
    push(Math.abs(zt), "lex", zt >= 0 ? "Vocabulário largo: " + pc(ttr) + "% das palavras aparecem uma vez só." : "Você repete palavras sem medo — repetição como ritmo, não descuido.");
    const zl = z(longPct, B.long);
    if (zl > 0) push(zl, "lex", "Palavra longa não te assusta: " + pc(longPct) + "% do texto tem oito letras ou mais.");
    const zp = z(persRate, B.pers);
    if (zp > 0) push(zp, "pers", "Você fala direto — primeira e segunda pessoa a cada poucas linhas.");
    const zo = z(openRate, B.open);
    if (zo > 0 && opens > 1) push(zo, "open", pc(openRate) + "% das frases começam com conjunção — cadência de voz falada.");
  } else {
    if (n >= 3) {
      const zc = z(cv, B.cv);
      if (zc >= 0) push(zc, "cad", "You write in bursts: sentences run from " + mn + " to " + mx + " words — a short one cuts, a long one breathes.");
      else push(-zc * 0.9, "cad", "Steady cadence: nearly every sentence orbits " + Math.round(mean) + " words. You write in measure.");
    }
    const zm = z(mean, B.mean);
    push(
      Math.abs(zm) * 0.85,
      "cad",
      zm >= 0
        ? "Long breath: " + Math.round(mean) + " words per sentence on average — you trust the extended line."
        : "Clean cuts: " + Math.round(mean) + " words per sentence on average. No padding."
    );
    if (dashes > 0) push(z(dashes / n, B.dash), "punct", dashes >= n ? "A dash in nearly every sentence — you think in asides." : "A dash every " + per(dashes) + " sentences — you think in asides.");
    if (semis > 0) push(z(semis / n, B.semi), "punct", "Actual semicolons — " + semis + " across " + n + " sentences; almost nobody does that anymore.");
    if (parens > 0) push(z(parens / n, B.paren), "punct", "You open parentheses (" + parens + (parens > 1 ? " times" : " time") + " here) — the voice annotates itself.");
    if (ellips > 0) push(z(ellips / n, B.ellip), "punct", "An ellipsis every " + per(ellips) + " sentences… you leave thoughts hanging.");
    if (quests > 0) push(z(quests / n, B.quest), "punct", quests + (quests > 1 ? " questions" : " question") + " across " + n + " sentences — you write in conversation.");
    const zt = z(ttr, B.ttr);
    push(Math.abs(zt), "lex", zt >= 0 ? "Wide vocabulary: " + pc(ttr) + "% of your words appear only once." : "You repeat words on purpose — repetition as rhythm, not neglect.");
    const zl = z(longPct, B.long);
    if (zl > 0) push(zl, "lex", "Long words do not scare you: " + pc(longPct) + "% of the text runs seven letters or more.");
    const zp = z(persRate, B.pers);
    if (zp > 0) push(zp, "pers", "You speak straight to the reader — first and second person throughout.");
    const zo = z(openRate, B.open);
    if (zo > 0 && opens > 1) push(zo, "open", pc(openRate) + "% of sentences open with a conjunction — spoken-voice cadence.");
  }

  cand.sort((a, b) => b.z - a.z);
  const lines: string[] = [];
  const used: Record<string, boolean> = {};
  for (const c of cand) {
    if (used[c.group]) continue;
    used[c.group] = true;
    lines.push(c.txt);
    if (lines.length === 3) break;
  }

  const fm = (v: number): string => {
    const t = (Math.round(v * 10) / 10).toFixed(1);
    return lang === "pt" ? t.replace(".", ",") : t;
  };
  const metrics: DemoMetric[] = [
    { value: String(n), label: lang === "pt" ? (n === 1 ? "frase" : "frases") : n === 1 ? "sentence" : "sentences" },
    { value: mn + "–" + mx, label: lang === "pt" ? "palavras por frase" : "words per sentence" },
    { value: fm(mean), label: lang === "pt" ? "média" : "average" },
    { value: pc(ttr) + "%", label: lang === "pt" ? "palavras únicas" : "unique words" },
  ];
  if (dashes > 0) metrics.push({ value: String(dashes), label: lang === "pt" ? (dashes === 1 ? "travessão" : "travessões") : dashes === 1 ? "dash" : "dashes" });
  if (quests > 0) metrics.push({ value: String(quests), label: lang === "pt" ? (quests === 1 ? "pergunta" : "perguntas") : quests === 1 ? "question" : "questions" });

  return { ok: true, lines, metrics, truncated, lang };
}

const CASCADE_DUR = 0.55;
const CASCADE_STEP = 0.07;
const CASCADE_BASE = 0.05;
const CASCADE_EASE = "cubic-bezier(0.16,1,0.3,1)";

function cascadeAnim(index: number): string {
  if (reducedMotion()) return "none";
  return `cultivFadeUp ${CASCADE_DUR}s ${(CASCADE_BASE + index * CASCADE_STEP).toFixed(2)}s ${CASCADE_EASE} both`;
}

export function initDemo(root: HTMLElement): void {
  const textarea = root.querySelector<HTMLTextAreaElement>("#demoText");
  const readBtn = root.querySelector<HTMLButtonElement>("#demoReadBtn");
  const errorEl = root.querySelector<HTMLElement>("#demoError");
  const resultEl = root.querySelector<HTMLElement>("#demoResult");
  const linesEl = root.querySelector<HTMLElement>("#demoLines");
  const metricsEl = root.querySelector<HTMLElement>("#demoMetrics");
  const truncEl = root.querySelector<HTMLElement>("#demoTrunc");
  const frameEl = root.querySelector<HTMLElement>("#demoFrame");
  const goConstBtn = root.querySelector<HTMLButtonElement>("#demoGoConstellation");
  if (!textarea || !readBtn || !errorEl || !resultEl || !linesEl || !metricsEl || !truncEl || !frameEl) return;

  let dirty = false;

  const hideError = () => {
    errorEl.hidden = true;
    errorEl.textContent = "";
  };
  const hideResult = () => {
    resultEl.hidden = true;
    linesEl.replaceChildren();
    metricsEl.replaceChildren();
    truncEl.hidden = true;
  };
  const showError = (msg: string) => {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  };

  textarea.addEventListener("input", () => {
    dirty = true;
    hideError();
    hideResult();
  });

  onLangChange((lang) => {
    if (dirty) return;
    textarea.value = lang === "en" ? DEMO_EXAMPLE_EN : DEMO_EXAMPLE_PT;
    hideError();
    hideResult();
  });

  const render = (r: Extract<ReadResult, { ok: true }>) => {
    linesEl.replaceChildren();
    r.lines.forEach((text, i) => {
      const p = document.createElement("p");
      p.className = "demo__line";
      p.style.animation = cascadeAnim(i);
      if (i === 0) {
        const acid = document.createElement("span");
        acid.className = "demo__acid";
        acid.textContent = text;
        p.appendChild(acid);
      } else {
        p.textContent = text;
      }
      linesEl.appendChild(p);
    });

    metricsEl.replaceChildren();
    r.metrics.forEach((m) => {
      const badge = document.createElement("span");
      badge.className = "demo__metric";
      const value = document.createElement("span");
      value.className = "demo__metricValue";
      value.textContent = m.value;
      const label = document.createElement("span");
      label.className = "demo__metricLabel";
      label.textContent = m.label;
      badge.append(value, label);
      metricsEl.appendChild(badge);
    });
    metricsEl.style.animation = cascadeAnim(r.lines.length);

    if (r.truncated) {
      truncEl.textContent = r.lang === "pt" ? "Texto longo — li as primeiras 400 palavras." : "Long text — I read the first 400 words.";
      truncEl.hidden = false;
    } else {
      truncEl.hidden = true;
    }

    frameEl.style.animation = cascadeAnim(r.lines.length + 2);
    resultEl.hidden = false;
  };

  readBtn.addEventListener("click", () => {
    const r = readWriting(textarea.value, getLang());
    if (!r.ok) {
      hideResult();
      showError(r.error);
      return;
    }
    hideError();
    render(r);
  });

  goConstBtn?.addEventListener("click", () => {
    const el = document.getElementById("constelacao");
    const sy = window.scrollY || document.documentElement.scrollTop || 0;
    const y = el ? el.getBoundingClientRect().top + sy : document.documentElement.scrollHeight;
    smoothScrollTo(y);
  });
}

if (import.meta.env?.DEV) {
  const a = readWriting(DEMO_EXAMPLE_PT, "pt");
  const b = readWriting(DEMO_EXAMPLE_PT, "pt");
  console.assert(JSON.stringify(a) === JSON.stringify(b), "[demo-reader] identical input produced different output");
  const c = readWriting(DEMO_EXAMPLE_EN, "en");
  if (a.ok && c.ok) {
    console.assert(a.lines[0] !== c.lines[0], "[demo-reader] two different texts produced the same first line");
  } else {
    console.assert(false, "[demo-reader] self-check inputs unexpectedly failed to produce a reading");
  }
}
