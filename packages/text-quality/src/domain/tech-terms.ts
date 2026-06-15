export const TECH_LEXICON_TERMS = new Set([
  "api",
  "apis",
  "algoritmo",
  "algoritmos",
  "algorithm",
  "algorithms",
  "backend",
  "backends",
  "banco",
  "bug",
  "bugs",
  "cache",
  "caches",
  "codebase",
  "codigo",
  "código",
  "database",
  "databases",
  "deploy",
  "deploys",
  "docker",
  "endpoint",
  "endpoints",
  "feature",
  "features",
  "framework",
  "frameworks",
  "frontend",
  "frontends",
  "infraestrutura",
  "infrastructure",
  "kubernetes",
  "legacy",
  "llm",
  "llms",
  "microservice",
  "microservices",
  "microservico",
  "microserviço",
  "middleware",
  "modelo",
  "modelos",
  "model",
  "models",
  "pipeline",
  "pipelines",
  "prompt",
  "prompts",
  "query",
  "queries",
  "refactor",
  "refactoring",
  "release",
  "releases",
  "rollback",
  "rollbacks",
  "sprint",
  "sprints",
  "stack",
  "stacks",
  "token",
  "tokens",
  "versao",
  "versão",
  "version",
  "versions"
]);

const NON_TECHNICAL_TOPIC_SIGNALS = [
  /\bcarreira\b/u,
  /\bcareer\b/u,
  /\blideran[cç]a\b/u,
  /\bleadership\b/u,
  /\baprendizado\b/u,
  /\blearning\b/u,
  /\bcomunica[cç][aã]o\b/u,
  /\bcommunication\b/u,
  /\brotina\b/u,
  /\broutine\b/u,
  /\brelacionamento\b/u,
  /\brelationships?\b/u,
  /\bvida pessoal\b/u,
  /\bpersonal growth\b/u,
  /\bmotiva[cç][aã]o\b/u,
  /\bmotivation\b/u,
  /\bautoconhecimento\b/u,
  /\bself[- ]awareness\b/u
];

const TECHNICAL_TOPIC_SIGNALS = [
  /\bapi\b/u,
  /\barquitetura\b/u,
  /\barchitecture\b/u,
  /\bbackend\b/u,
  /\bfrontend\b/u,
  /\bc[oó]digo\b/u,
  /\bcodebase\b/u,
  /\bdeploy\b/u,
  /\binfraestrutura\b/u,
  /\binfrastructure\b/u,
  /\bmicroserv/i,
  /\bkubernetes\b/u,
  /\bdocker\b/u,
  /\bframework\b/u,
  /\bllm\b/u,
  /\bprompt engineering\b/u,
  /\bsystem design\b/u,
  /\bdesign de sistema\b/u,
  /\brefactor/i,
  /\bendpoint\b/u,
  /\bdatabase\b/u,
  /\bbanco de dados\b/u,
  /\bci\/?cd\b/u,
  /\bstack\b/u,
  /\bcache\b/u
];

export function isTechLexiconTerm(token: string): boolean {
  return TECH_LEXICON_TERMS.has(token.toLowerCase());
}

export function countTechTermHits(text: string): number {
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}0-9]+/u)
    .filter((token) => token.length > 2);

  return tokens.filter((token) => isTechLexiconTerm(token)).length;
}

export function filterTechLexiconTerms(terms: readonly string[]): readonly string[] {
  return terms.filter((term) => !isTechLexiconTerm(term));
}

export function textHasNonTechnicalTopicSignals(text: string): boolean {
  const normalized = text.toLowerCase();
  return NON_TECHNICAL_TOPIC_SIGNALS.some((pattern) => pattern.test(normalized));
}

export function textHasTechnicalTopicSignals(text: string): boolean {
  const normalized = text.toLowerCase();
  return TECHNICAL_TOPIC_SIGNALS.some((pattern) => pattern.test(normalized));
}
