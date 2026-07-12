// Payload embutido na página para o script cliente — projeção dos mesmos
// dados de constellation.ts (fonte única), só com o que a interação usa.
import { EDGES, NODES, SITE, TAGLINE, nodeMeta } from "./constellation";

export interface ClientNode {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface ClientPayload {
  siteTitle: string;
  siteDescription: string;
  tagline: string;
  nodes: ClientNode[];
  edges: [string, string, number][];
}

export const clientPayload = (): ClientPayload => ({
  siteTitle: SITE.title,
  siteDescription: SITE.description,
  tagline: TAGLINE,
  nodes: NODES.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: nodeMeta(n).title,
    description: nodeMeta(n).description,
  })),
  edges: EDGES,
});
