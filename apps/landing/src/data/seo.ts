// JSON-LD da landing v5 — Organization / WebSite / SoftwareApplication /
// FAQPage. GEO: motores generativos citam com mais confiança o que chega
// estruturado. Fica em pt-BR de propósito: o en vive num toggle client-side
// na MESMA URL, e anotar dois idiomas num só documento confundiria os parsers.
import { PLANS } from "./plans";
import { SITE } from "./site";

const id = (site: URL, fragment: string): string => new URL(fragment, site).href;

/** As 12 perguntas do Ato 7 (FAQ) — copy do design, verbatim, sem as tags
    inline (<em>/<strong> ficam só no HTML da seção). */
const FAQ: { q: string; a: string }[] = [
  {
    q: "Isso realmente soa como eu, ou é mais uma IA imitando?",
    a: "A calibração capta como você raciocina e argumenta (Reasoning + Argument-Development Signature), não só a superfície do estilo. Não é uma IA genérica com um prompt bonito por cima — é o mapa do seu pensamento guiando cada texto.",
  },
  {
    q: "Preciso subir os meus textos antigos pra ele aprender?",
    a: "Não. A Cultiv não raspa uploads. Ela te guia por 4 perguntas — você responde escrevendo, em alguns minutos — e é isso que vira o seu Perfil de Voz.",
  },
  {
    q: "Vocês treinam com os meus textos? Meus dados ficam seguros?",
    a: "Não pra treinar nada de ninguém. Os textos que você escreve na calibração servem só pra montar o seu Perfil de Voz — ficam criptografados e ligados só à sua conta, e o texto cru nunca é enviado ao modelo que escreve. A Cultiv gera a partir de sinais derivados da sua voz.",
  },
  {
    q: "A minha voz pode acabar no texto de outra pessoa?",
    a: "Não. Tudo o que é da sua voz fica ligado só à sua conta — cada geração lê apenas a sua voz, e a Cultiv nunca a usa pra escrever pra outro usuário.",
  },
  {
    q: "E se eu mudar de ideia? Consigo apagar a minha voz?",
    a: "Consegue, quando quiser. Ao revogar o consentimento, a Cultiv apaga tudo — os exemplos, o Perfil de Voz, as versões e os diagnósticos — e registra isso. Sua voz sai por completo.",
  },
  {
    q: "O texto já sai pronto pra publicar, ou ainda preciso editar?",
    a: "Sai um rascunho na sua voz — forte, mas não um carimbo final. Você continua sendo o autor: lê, ajusta o que quiser e publica. A Cultiv acelera a escrita; ela não tira você da decisão.",
  },
  {
    q: "E se a voz sair errada?",
    a: "Você recalibra. O Perfil de Voz é durável e ajustável — não é um chute de uma vez só.",
  },
  {
    q: "O que eu consigo escrever com ele?",
    a: "Você começa pelo que quer dizer — compartilhar uma ideia, explicar a fundo, engajar, contar uma história, atualizar assinantes ou registrar uma decisão. O canal (blog, e-mail, social, rede profissional) é um ajuste opcional, não um template a preencher.",
  },
  {
    q: "Dá pra ter uma voz diferente pra cada canal?",
    a: "Hoje a Cultiv aprende uma voz: a sua. Ela é durável e você a afina recalibrando — não é um perfil por canal. O que muda entre um post e um e-mail é a intenção e o formato, não a sua voz.",
  },
  {
    q: "O que é o teste grátis? Preciso de cartão?",
    a: "Não precisa de cartão pra começar, e o teste é o produto inteiro (Perfil de Voz completo, todos os formatos, a mesma qualidade dos planos). Vai até 7 dias ou 5 gerações, o que vier primeiro. O cartão só entra quando você escolhe um plano.",
  },
  {
    q: "O que acontece quando o teste acaba? Qual plano eu escolho?",
    a: "Nada é cobrado sozinho: a geração pausa e a sua conta, voz e histórico ficam preservados até você escolher um plano. São três — Explorador, Criador e Profissional — e a diferença é quanto você gera por mês e os modelos disponíveis. O Criador é o melhor equilíbrio pra maioria, e dá pra trocar depois.",
  },
  {
    q: "Funciona em português e em inglês?",
    a: "A Cultiv escreve em português e inglês. As perguntas da calibração hoje são em português; a leitura e a geração cobrem os dois idiomas.",
  },
];

/** Home: Organization + WebSite + SoftwareApplication (offers ADR 0006, BRL
    mensal) + FAQPage. Um objeto por entidade — o layout emite um <script>
    JSON-LD para cada um. */
export function homeGraph(site: URL): object[] {
  const org = {
    "@type": "Organization",
    "@id": id(site, "/#organization"),
    name: SITE.name,
    url: site.href,
    logo: id(site, "/brand/icon-dark-bg.svg"),
  };
  const website = {
    "@type": "WebSite",
    "@id": id(site, "/#website"),
    url: site.href,
    name: SITE.name,
    description: SITE.pt.description,
    inLanguage: "pt-BR",
    publisher: { "@id": org["@id"] },
  };
  const software = {
    "@type": "SoftwareApplication",
    "@id": id(site, "/#software"),
    name: SITE.name,
    url: site.href,
    description: SITE.pt.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: PLANS.map((p) => ({
      "@type": "Offer",
      name: `Plano ${p.name}`,
      description: `${p.tag.pt} Inclui: ${p.features.map((f) => f.pt).join(", ")}.`,
      price: p.priceValue,
      priceCurrency: "BRL",
    })),
    publisher: { "@id": org["@id"] },
  };
  const faq = {
    "@type": "FAQPage",
    "@id": id(site, "/#faq"),
    inLanguage: "pt-BR",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return [org, website, software, faq];
}
