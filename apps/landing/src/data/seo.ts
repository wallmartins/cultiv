// JSON-LD da landing — grafo schema.org compartilhado entre a home e as
// páginas por nó. GEO: motores generativos citam com mais confiança o que
// chega estruturado (Organization/WebSite/SoftwareApplication/FAQPage).
import {
  NODES,
  PLANS,
  SITE,
  connectionsOf,
  nodeMeta,
  type ConstellationNode,
} from "./constellation";

const id = (site: URL, fragment: string) => new URL(fragment, site).href;

/** Entidades presentes em todas as páginas da constelação. */
export function baseGraph(site: URL): object[] {
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
    description: SITE.description,
    inLanguage: "pt-BR",
    publisher: { "@id": org["@id"] },
  };
  const software = {
    "@type": "SoftwareApplication",
    "@id": id(site, "/#software"),
    name: SITE.name,
    url: site.href,
    description: SITE.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: PLANS.map((p) => ({
      "@type": "Offer",
      name: `Plano ${p.name}`,
      description: `${p.tag} Inclui: ${p.features.join(", ")}.`,
      price: p.priceValue,
      priceCurrency: "BRL",
    })),
    publisher: { "@id": org["@id"] },
  };
  return [org, website, software];
}

/** Home: grafo base + índice dos conceitos da constelação. */
export function homeGraph(site: URL): object[] {
  const itemList = {
    "@type": "ItemList",
    name: "A constelação Cultiv — conceitos do Perfil de Voz e da Geração",
    itemListElement: NODES.map((n, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: n.label,
      description: n.what,
      url: id(site, `/${n.slug}`),
    })),
  };
  const faq = {
    "@type": "FAQPage",
    "@id": id(site, "/#faq"),
    mainEntity: [
      {
        "@type": "Question",
        name: "O que é a Cultiv?",
        acceptedAnswer: { "@type": "Answer", text: SITE.description },
      },
      {
        "@type": "Question",
        name: "O que é um Perfil de Voz?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `${NODES[0].what} ${NODES[0].how}`,
        },
      },
    ],
  };
  return [...baseGraph(site), itemList, faq];
}

/** Página de um nó: WebPage + breadcrumb + FAQ (o quê / como funciona). */
export function nodeGraph(site: URL, n: ConstellationNode): object[] {
  const pageUrl = id(site, `/${n.slug}`);
  const meta = nodeMeta(n);
  const webPage = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: meta.title,
    description: meta.description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": id(site, "/#website") },
    about: {
      "@type": "DefinedTerm",
      name: n.label,
      description: n.what,
      termCode: n.id,
      inDefinedTermSet: id(site, "/#constelacao"),
    },
    relatedLink: connectionsOf(n.id).map((c) => id(site, `/${c.slug}`)),
  };
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: site.href },
      { "@type": "ListItem", position: 2, name: n.cat },
      { "@type": "ListItem", position: 3, name: n.label, item: pageUrl },
    ],
  };
  const faq = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: `O que é ${n.label} na Cultiv?`,
        acceptedAnswer: { "@type": "Answer", text: n.what },
      },
      {
        "@type": "Question",
        name: `Como funciona ${n.label} na Cultiv?`,
        acceptedAnswer: { "@type": "Answer", text: n.how },
      },
    ],
  };
  return [...baseGraph(site), webPage, breadcrumb, faq];
}
