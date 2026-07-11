// Tipos do payload embutido (espelho de src/data/constellation-client.ts —
// o script roda no browser e não importa módulos de build).

export interface ClientNode {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface AppData {
  siteTitle: string;
  siteDescription: string;
  tagline: string;
  nodes: ClientNode[];
  edges: [string, string, number][];
}

/** Lê o JSON embutido pela raiz de composição. */
export function readAppData(app: HTMLElement): AppData {
  return JSON.parse(app.querySelector("[data-constellation-data]")!.textContent!);
}
