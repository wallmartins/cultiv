export function buildGeoRobotsTxt(siteUrl: string): string {
  const aiAgents = [
    "GPTBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "Google-Extended",
    "PerplexityBot",
    "Applebot-Extended",
    "cohere-ai"
  ];

  const aiRules = aiAgents
    .map((agent) => `User-agent: ${agent}\nAllow: /`)
    .join("\n\n");

  return `User-agent: *
Allow: /

${aiRules}

Sitemap: ${siteUrl}/sitemap.xml
# LLM product documentation: ${siteUrl}/llms.txt
`;
}
