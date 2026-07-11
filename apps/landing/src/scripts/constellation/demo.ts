// Demo "leitura da sua voz": heurísticas puras + apresentação.
// analyzeVoice é pura (texto → métricas/resumo) — a mesma matemática do
// protótipo v3; initDemo liga textarea, contador e o card de resultado.

import type { Els } from "./els";

export interface VoiceMetric {
  name: string;
  value: string;
  /** 0..1 — vira largura da barra. */
  v: number;
}

export interface VoiceReading {
  metrics: VoiceMetric[];
  summary: string;
}

export function analyzeVoice(text: string): VoiceReading {
  const ws = text.trim() ? text.trim().split(/\s+/) : [];
  const sentences = text.split(/[.!?…]+/).filter((x) => x.trim().length > 1);
  const avgLen = sentences.length ? ws.length / sentences.length : ws.length;
  const uniq = new Set(
    ws.map((w) => w.toLowerCase().replace(/[^\p{L}]/gu, "")).filter(Boolean)
  );
  const richness = Math.min(1, uniq.size / Math.max(1, ws.length * 0.72));
  const informal = (text.match(/\b(você|vc|né|tá|pra|cara|tipo|a gente)\b/gi) || []).length;
  const formality = Math.max(
    0.15,
    Math.min(0.95, 0.75 - informal * 0.09 + (avgLen > 18 ? 0.12 : 0))
  );
  const cadence = Math.max(0.1, Math.min(0.95, avgLen / 26));
  const warmth = Math.max(
    0.15,
    Math.min(0.95, 0.35 + informal * 0.1 + (text.match(/[!?]/g) || []).length * 0.06)
  );
  return {
    metrics: [
      { name: "Formalidade", value: formality > 0.6 ? "sóbrio" : "coloquial", v: formality },
      { name: "Cadência", value: `${avgLen.toFixed(0)} palavras/frase`, v: cadence },
      { name: "Riqueza vocabular", value: `${uniq.size} termos únicos`, v: richness },
      { name: "Calor", value: warmth > 0.55 ? "caloroso" : "contido", v: warmth },
    ],
    summary:
      `Sua escrita tende ao registro ${formality > 0.6 ? "sóbrio" : "coloquial"}, ` +
      `com frases ${avgLen > 18 ? "longas e ponderadas" : "curtas e diretas"}. ` +
      `O Perfil de Voz completo mapeia ainda estrutura, argumentação e raciocínio.`,
  };
}

export function initDemo(els: Els): void {
  const d = els.demo;
  let loading = false;

  const wordCount = () => (d.text.value.trim() ? d.text.value.trim().split(/\s+/).length : 0);
  const sync = () => {
    const count = wordCount();
    d.words.textContent = String(count);
    d.btn.disabled = count < 10 || loading;
    d.btn.textContent = loading ? "Analisando…" : "Analisar minha voz";
  };

  const render = ({ metrics, summary }: VoiceReading) => {
    d.metrics.innerHTML = "";
    const fills: HTMLElement[] = [];
    for (const m of metrics) {
      const row = document.createElement("div");
      row.className = "metric";
      row.innerHTML =
        `<div class="metric-head"><span class="metric-name"></span>` +
        `<span class="metric-value"></span></div>` +
        `<div class="metric-track"><div class="metric-fill"></div></div>`;
      row.querySelector(".metric-name")!.textContent = m.name;
      row.querySelector(".metric-value")!.textContent = m.value;
      const fill = row.querySelector<HTMLElement>(".metric-fill")!;
      fill.dataset.pct = `${Math.round(m.v * 100)}%`;
      fills.push(fill);
      d.metrics.appendChild(row);
    }
    d.summary.textContent = summary;
    d.empty.hidden = true;
    d.card.hidden = false;
    // dois rAFs: garante o layout com width:0 antes da transição de largura
    requestAnimationFrame(() =>
      requestAnimationFrame(() => fills.forEach((f) => (f.style.width = f.dataset.pct!)))
    );
  };

  d.text.addEventListener("input", () => {
    d.card.hidden = true;
    d.empty.hidden = false;
    sync();
  });
  d.btn.addEventListener("click", () => {
    loading = true;
    sync();
    setTimeout(() => {
      loading = false;
      render(analyzeVoice(d.text.value));
      sync();
    }, 1400);
  });
  sync();
}
