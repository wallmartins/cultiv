import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";

const config: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0",
  billingPlanId: "pro",
  billingUserId: "backend"
};

describe("backend voice rebuilds", () => {
  it("derives profile and diagnostics asynchronously after example mutations", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    await Effect.runPromise(services.voiceConsent.grantConsent("user_1"));

    await Effect.runPromise(
      services.voice.createExample("user_1", {
        text: "Eu escrevo em primeira pessoa, com frases curtas, objetivas e bem adaptadas para posts no LinkedIn.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post",
        pinned: true
      })
    );

    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const screen = Effect.runSync(services.voice.getProfileScreen("user_1"));
    expect(screen).toBeDefined();
    expect(screen?.profile.version).toBe(1);
    expect(screen?.profile.confidence).toBe("low");
    expect(screen?.profile.adaptationMode).toBe("conservative");
    expect(screen?.diagnostics.activeVersion).toBe(1);
    expect(screen?.diagnostics.updating).toBe(false);
    expect(screen?.diagnostics.pendingRebuild.status).toBe("idle");
    expect(screen?.materialBase.activeExamples).toBe(1);

    const examples = Effect.runSync(services.voice.listExamples("user_1"));
    expect(examples.items[0]?.pendingProfileImpact).toBe(false);
    expect(examples.items[0]?.targetProfileVersion).toBe(1);
  });

  it("triggers rebuild after example create and promotes the committed version", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    await Effect.runPromise(services.voiceConsent.grantConsent("user_1"));

    Effect.runSync(
      services.voice.createExample("user_1", {
        text: "Escrevo newsletters com contexto, opinião e ritmo mais reflexivo quando o assunto pede profundidade.",
        language: "pt-BR",
        channel: "newsletter",
        explicitContentType: "newsletter"
      })
    );

    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const screen = Effect.runSync(services.voice.getProfileScreen("user_1"));
    expect(screen?.profile.version).toBe(1);
    expect(screen?.materialBase.byContentType.newsletter).toBe(1);

    const examples = Effect.runSync(services.voice.listExamples("user_1"));
    expect(examples.total).toBe(1);
    expect(examples.items[0]?.pendingProfileImpact).toBe(false);
    expect(examples.items[0]?.targetProfileVersion).toBe(1);
  });

  it("raises confidence when the user has enough diverse active examples", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    await Effect.runPromise(services.voiceConsent.grantConsent("user_1"));

    const inputs = [
      {
        text: "Eu escrevo posts para LinkedIn em primeira pessoa, com opiniÃ£o clara e ritmo direto para abrir conversa.",
        language: "pt-BR",
        channel: "linkedin",
        format: "post",
        explicitContentType: "linkedin-post"
      },
      {
        text: "Nas newsletters eu alongo mais o raciocÃ­nio, conecto bastidores e fecho com um convite direto para resposta.",
        language: "pt-BR",
        channel: "newsletter",
        format: "email",
        explicitContentType: "newsletter"
      },
      {
        text: "Quando escrevo artigos de blog, gosto de organizar a ideia em blocos curtos, com exemplos e argumentos mais desenvolvidos.",
        language: "pt-BR",
        channel: "blog",
        format: "article",
        explicitContentType: "long-form-blog"
      },
      {
        text: "Em threads, eu abro com uma tensÃ£o simples, encadeio o raciocÃ­nio em passos curtos e termino com uma frase memorÃ¡vel.",
        language: "pt-BR",
        channel: "twitter",
        format: "thread",
        explicitContentType: "twitter-thread"
      },
      {
        text: "Em textos de arquitetura, eu continuo falando em primeira pessoa, mas deixo o tom mais sÃ³brio e detalhado quando preciso explicar trade-offs.",
        language: "pt-BR",
        channel: "blog",
        format: "essay",
        explicitContentType: "architecture-post",
        pinned: true
      }
    ] as const;

    for (const input of inputs) {
      await Effect.runPromise(services.voice.createExample("user_1", input));
    }

    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const screen = Effect.runSync(services.voice.getProfileScreen("user_1"));
    expect(screen?.profile.confidence).toBe("high");
    expect(screen?.profile.adaptationMode).toBe("standard");
    expect(screen?.diagnostics.reasonCodes).toEqual([]);
    expect(screen?.diagnostics.nextActionCodes).toEqual([]);
    expect(screen?.diagnostics.summary).toContain("bem representada");
    expect(screen?.diagnostics.bestCoveredContentTypes).toEqual([]);
    expect(screen?.diagnostics.underrepresentedContentTypes.length).toBeGreaterThan(0);
    expect(screen?.materialBase.activeExamples).toBe(5);
    expect(screen?.materialBase.pinnedExamples).toBe(1);
  });

  it("keeps language conflict and low coverage visible in diagnostics", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-05-14T00:00:00.000Z")
      })
    );

    await Effect.runPromise(services.voiceConsent.grantConsent("user_1"));

    const inputs = [
      {
        text: "Eu escrevo em primeira pessoa para LinkedIn, com frases curtas e bem diretas para provocar conversa.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post"
      },
      {
        text: "TambÃ©m gosto de escrever para LinkedIn mantendo opiniÃ£o clara, experiÃªncia prÃ¡tica e uma abertura mais provocativa.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post"
      },
      {
        text: "I also write in English for LinkedIn, keeping the same direct posture but with a slightly more analytical vocabulary.",
        language: "en-US",
        channel: "linkedin",
        explicitContentType: "linkedin-post"
      },
      {
        text: "Quando puxo um relato pessoal, eu continuo em tom direto e foco nas decisÃµes que mudaram o resultado.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post"
      },
      {
        text: "Mesmo em casos mais reflexivos, eu volto para LinkedIn com uma conclusÃ£o curta e bem opinativa.",
        language: "pt-BR",
        channel: "linkedin",
        explicitContentType: "linkedin-post"
      }
    ] as const;

    for (const input of inputs) {
      await Effect.runPromise(services.voice.createExample("user_1", input));
    }

    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const screen = Effect.runSync(services.voice.getProfileScreen("user_1"));
    expect(screen?.profile.confidence).toBe("medium");
    expect(screen?.diagnostics.reasonCodes).toContain("insufficient_diversity");
    expect(screen?.diagnostics.reasonCodes).toContain("language_conflict");
    expect(screen?.diagnostics.nextActionCodes).toContain("add_examples_from_other_content_types");
    expect(screen?.diagnostics.nextActionCodes).toContain("review_conflicting_examples");
    expect(screen?.diagnostics.summary).toContain("misturam idiomas");
    expect(screen?.diagnostics.bestCoveredContentTypes[0]?.contentType).toBe("linkedin-post");
    expect(screen?.profile.primaryLanguage).toBe("pt-BR");
  });
});
