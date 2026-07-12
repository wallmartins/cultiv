// A constelação Cultiv — fonte única da verdade do conteúdo da landing v3.
// Consumida pelo template (HTML crawleável), pelo JSON-LD, pelas rotas
// estáticas por nó e pelo script de interação (via JSON embutido).
// Copy portada verbatim de "Cultiv Landing v3" (claude.ai/design).

export type NodeKind = "hub" | "know" | "proc" | "gate";

export interface ConstellationNode {
  id: string;
  /** Segmento de URL da página estática do nó (SEO: uma URL por seção). */
  slug: string;
  /** Coordenadas no campo 600×800. */
  x: number;
  y: number;
  /** Reposicionamento da cauda no mobile (rótulos sem sobreposição). */
  mx?: number;
  my?: number;
  kind: NodeKind;
  label: string;
  cat: string;
  what: string;
  how: string;
  cta?: { label: string; target: "demo" | "planos" };
}

export const NODES: ConstellationNode[] = [
  {
    id: "perfil",
    slug: "perfil-de-voz",
    x: 325,
    y: 235,
    kind: "hub",
    label: "Perfil de Voz",
    cat: "Perfil de Voz",
    what: "O coração da Cultiv. Um modelo vivo que captura como você escreve: seu tom, seu ritmo, seu vocabulário e a forma como você constrói ideias.",
    how: "É criado numa calibração guiada de 15 minutos e evolui a cada texto. Nenhuma geração acontece sem consultá-lo — ele é a bússola de tudo que a Cultiv escreve.",
    cta: { label: "Experimentar Demo", target: "demo" },
  },
  {
    id: "tom",
    slug: "tom",
    x: 165,
    y: 240,
    kind: "know",
    label: "Tom",
    cat: "Perfil de Voz",
    what: "O registro da sua escrita: formal ou informal, direto ou caloroso, sóbrio ou entusiasmado.",
    how: "A Cultiv mede marcadores de formalidade e emoção nos seus textos e reproduz o mesmo registro em tudo que gera.",
  },
  {
    id: "vocabulario",
    slug: "vocabulario",
    x: 205,
    y: 130,
    kind: "know",
    label: "Vocabulário",
    cat: "Perfil de Voz",
    what: "As palavras que são suas: termos técnicos, expressões recorrentes — e o que você nunca diria.",
    how: "O perfil guarda seu repertório ativo e as palavras a evitar, para que o texto soe seu, não genérico.",
  },
  {
    id: "ritmo",
    slug: "ritmo",
    x: 320,
    y: 78,
    kind: "know",
    label: "Ritmo",
    cat: "Perfil de Voz",
    what: "A cadência das suas frases: curtas e diretas, longas e ponderadas, ou a alternância entre elas.",
    how: "A geração respeita seu comprimento médio de frase e sua pontuação característica, parágrafo a parágrafo.",
  },
  {
    id: "estrutura",
    slug: "estrutura",
    x: 440,
    y: 120,
    kind: "know",
    label: "Estrutura",
    cat: "Perfil de Voz",
    what: "Como você organiza um texto: a abertura, a progressão das ideias, o fechamento.",
    how: "O motor planeja o esqueleto do texto seguindo os padrões estruturais mapeados no seu perfil.",
  },
  {
    id: "argumentacao",
    slug: "argumentacao",
    x: 498,
    y: 232,
    kind: "know",
    label: "Argumentação",
    cat: "Perfil de Voz",
    what: "Como você defende uma posição: exemplos, dados, analogias, certezas e hesitações.",
    how: "Cada argumento gerado segue a sua forma de convencer — não a de uma IA média.",
  },
  {
    id: "raciocinio",
    slug: "raciocinio",
    x: 478,
    y: 350,
    kind: "know",
    label: "Raciocínio",
    cat: "Perfil de Voz",
    what: "A assinatura do seu pensamento: como você observa um tema e chega a conclusões.",
    how: "É a camada mais profunda do perfil — a diferença entre soar como você e soar como qualquer um.",
  },
  {
    id: "audiencia",
    slug: "audiencia",
    x: 152,
    y: 352,
    kind: "know",
    label: "Audiência",
    cat: "Perfil de Voz",
    what: "Para quem você escreve — e como a sua voz se adapta a cada leitor.",
    how: "O perfil registra como você ajusta registro e profundidade entre audiências diferentes, e aplica isso a cada formato.",
  },
  {
    id: "intencao",
    slug: "intencao",
    x: 438,
    y: 458,
    mx: 448,
    my: 448,
    kind: "proc",
    label: "Intenção",
    cat: "Geração",
    what: "O ponto de partida de toda geração: o que você quer dizer, para quem e por quê.",
    how: "Você define o objetivo — convencer, ensinar, provocar — e a Cultiv traduz isso em direção para o texto.",
  },
  {
    id: "briefing",
    slug: "briefing",
    x: 388,
    y: 552,
    mx: 396,
    my: 534,
    kind: "proc",
    label: "Briefing",
    cat: "Geração",
    what: "Um formulário dinâmico com o que importa para o formato escolhido: tópico, ângulo, referências.",
    how: "Nada genérico: cada formato pede exatamente os campos que fazem sentido para ele.",
  },
  {
    id: "motor",
    slug: "motor-de-escrita",
    x: 318,
    y: 628,
    mx: 326,
    my: 602,
    kind: "proc",
    label: "Motor de Escrita",
    cat: "Geração",
    what: "O pipeline que escreve com a sua voz. Ele estuda o briefing, consulta seu Perfil de Voz e gera versões em paralelo.",
    how: "Cada parágrafo é verificado contra o perfil antes do refino. A melhor versão vence — sempre com a sua voz como bússola.",
  },
  {
    id: "refinamento",
    slug: "refinamento",
    x: 256,
    y: 662,
    mx: 252,
    my: 652,
    kind: "proc",
    label: "Refinamento",
    cat: "Geração",
    what: "A etapa que separa um rascunho de um texto pronto para publicar.",
    how: "Três níveis de polimento, com custo transparente em créditos antes de gerar. Sem surpresas.",
  },
  {
    id: "texto",
    slug: "texto-gerado",
    x: 214,
    y: 688,
    mx: 202,
    my: 698,
    kind: "proc",
    label: "Texto Gerado",
    cat: "Geração",
    what: "O resultado: um texto que poderia ter saído de você.",
    how: "Fiel ao seu tom, ritmo e raciocínio. Sua autenticidade, em escala.",
  },
  {
    id: "demo",
    slug: "demo",
    x: 132,
    y: 730,
    mx: 116,
    my: 746,
    kind: "gate",
    label: "Demo",
    cat: "Jornada",
    what: "Cole um parágrafo seu e veja, em segundos, o que a Cultiv enxerga na sua escrita.",
    how: "Um aperitivo do motor completo: tom, cadência, riqueza vocabular e mais — antes de criar seu perfil.",
    cta: { label: "Experimentar Demo", target: "demo" },
  },
  {
    id: "planos",
    slug: "planos",
    x: 52,
    y: 766,
    mx: 42,
    my: 778,
    kind: "gate",
    label: "Planos",
    cat: "Jornada",
    what: "Do Explorador ao Profissional: escolha o volume que acompanha o seu ritmo de criação.",
    how: "Todos os planos incluem o Perfil de Voz completo, suporte e atualizações.",
    cta: { label: "Ver Planos", target: "planos" },
  },
];

/** [origem, destino, opacidade-base da linha] */
export const EDGES: [string, string, number][] = [
  ["audiencia", "tom", 0.26],
  ["tom", "vocabulario", 0.3],
  ["vocabulario", "ritmo", 0.32],
  ["ritmo", "estrutura", 0.32],
  ["estrutura", "argumentacao", 0.3],
  ["argumentacao", "raciocinio", 0.28],
  ["perfil", "tom", 0.09],
  ["perfil", "vocabulario", 0.09],
  ["perfil", "ritmo", 0.09],
  ["perfil", "estrutura", 0.09],
  ["perfil", "argumentacao", 0.09],
  ["perfil", "raciocinio", 0.09],
  ["perfil", "audiencia", 0.09],
  ["raciocinio", "intencao", 0.26],
  ["perfil", "motor", 0.07],
  ["intencao", "briefing", 0.23],
  ["briefing", "motor", 0.2],
  ["motor", "refinamento", 0.17],
  ["refinamento", "texto", 0.14],
  ["texto", "demo", 0.12],
  ["demo", "planos", 0.1],
];

import type { PlanId } from "../config";

export interface Plan {
  id: PlanId;
  name: string;
  tag: string;
  price: string;
  /** Preço numérico em BRL para o JSON-LD (0 = grátis). */
  priceValue: number;
  per: string;
  features: string[];
  btn: string;
  featured: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "explorador",
    name: "Explorador",
    tag: "Para conhecer a sua voz digital.",
    price: "Grátis",
    priceValue: 0,
    per: "",
    features: [
      "Perfil de Voz completo",
      "10 créditos de geração/mês",
      "Formatos essenciais",
      "Refinamento básico",
    ],
    btn: "Começar grátis",
    featured: false,
  },
  {
    id: "criador",
    name: "Criador",
    tag: "Para quem publica toda semana.",
    price: "R$ 49",
    priceValue: 49,
    per: "/mês",
    features: [
      "Tudo do Explorador",
      "100 créditos de geração/mês",
      "Todos os formatos",
      "Refinamento avançado",
      "Perfis para 3 audiências",
    ],
    btn: "Assinar Criador",
    featured: true,
  },
  {
    id: "pro",
    name: "Profissional",
    tag: "Para volume e equipes.",
    price: "R$ 129",
    priceValue: 129,
    per: "/mês",
    features: [
      "Tudo do Criador",
      "Créditos ilimitados",
      "Refinamento premium",
      "Audiências ilimitadas",
      "Suporte prioritário",
    ],
    btn: "Assinar Profissional",
    featured: false,
  },
];

export const TAGLINE = "Escreve\ncomo você\npensa.";

export const SITE = {
  name: "Cultiv",
  title: "Cultiv — Escreve como você pensa",
  description:
    "Cultiv é um motor de escrita com IA que aprende a sua voz — tom, ritmo, vocabulário e raciocínio — e gera textos que só poderiam ser seus. Explore a constelação do Perfil de Voz.",
};

export const nodeBySlug = (slug: string): ConstellationNode | undefined =>
  NODES.find((n) => n.slug === slug);

export const nodeById = (id: string): ConstellationNode =>
  NODES.find((n) => n.id === id)!;

/** Conexões de um nó (rótulos vizinhos no grafo), na ordem das arestas. */
export const connectionsOf = (id: string): ConstellationNode[] =>
  EDGES.filter(([a, b]) => a === id || b === id).map(([a, b]) =>
    nodeById(a === id ? b : a)
  );

/** Meta por página de nó. */
export const nodeMeta = (n: ConstellationNode) => ({
  title: n.label === n.cat ? `${n.label} | Cultiv` : `${n.label} · ${n.cat} | Cultiv`,
  description: n.what,
});
