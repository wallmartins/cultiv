import { describe, expect, it } from "vitest";
import {
  formatThreadForDisplay,
  SHOWCASE_THREAD_PREVIEW_POST_COUNT,
  sliceThreadPostsForPreview
} from "../../apps/web/src/marketing/content/showcase/format-thread.js";

const backendThreadBlob =
  "Três anos publicando toda terça. Mesmo quando eu não tinha ideia nenhuma na cabeça. Muita gente acha que o segredo é um golpe de mestre em cada tweet. Não é. O segredo foi o volume de um formato pequeno que eu conseguia sustentar. Eu foquei em manter a thread ativa. Não importava se o conteúdo era brilhante ou apenas uma nota no meu cache. O importante era o usuário saber exatamente quando me encontrar. Sua consistência é um compromisso com quem te lê. Quando você aparece sempre, vira parte da rotina de alguém. Isso cria uma confiança que nenhum post viral constrói sozinho. O erro comum é tentar sustentar algo gigante quando você mal tem tempo. Escolha algo pequeno. Uma nota, uma reflexão rápida, um link. Qualquer coisa, desde que seja constante. Não busque a melhor versão do seu texto toda semana. Busque apenas o ato de publicar. Quando você remove a pressão da perfeição, o processo flui. O seu perfil precisa de regularidade para crescer. Se você falha na terça, quebra a expectativa. E uma audiência sem expectativa é uma audiência que esquece o seu nome. Mantenha o ritmo. O conteúdo é apenas o meio; o seu sinal constante é o que realmente importa.";

describe("formatThreadForDisplay", () => {
  it("splits inline numbered thread markers", () => {
    const posts = formatThreadForDisplay("1/ First tweet. 2/ Second tweet. 3/ Third tweet.");

    expect(posts).toEqual(["First tweet.", "Second tweet.", "Third tweet."]);
  });

  it("splits newline-separated numbered tweets", () => {
    const posts = formatThreadForDisplay(
      "1/ Three years publishing every Tuesday.\n2/ The secret was a small format.\n3/ Consistency is kindness."
    );

    expect(posts).toEqual([
      "Three years publishing every Tuesday.",
      "The secret was a small format.",
      "Consistency is kindness."
    ]);
  });

  it("chunks backend prose blobs into multiple posts", () => {
    const posts = formatThreadForDisplay(backendThreadBlob);

    expect(posts.length).toBeGreaterThanOrEqual(5);
    expect(posts.every((post) => post.length <= 240)).toBe(true);
  });

  it("returns an empty array for blank input", () => {
    expect(formatThreadForDisplay("   ")).toEqual([]);
  });

  it("keeps a single short paragraph as one post", () => {
    expect(formatThreadForDisplay("One short tweet-sized thought.")).toEqual([
      "One short tweet-sized thought."
    ]);
  });
});

describe("sliceThreadPostsForPreview", () => {
  it("returns all posts when within the preview limit", () => {
    const posts = ["a", "b", "c"];

    expect(sliceThreadPostsForPreview(posts)).toEqual({
      visible: posts,
      hiddenCount: 0
    });
  });

  it("slices to the default preview count", () => {
    const posts = Array.from({ length: 7 }, (_, index) => `post-${index + 1}`);

    expect(sliceThreadPostsForPreview(posts)).toEqual({
      visible: posts.slice(0, SHOWCASE_THREAD_PREVIEW_POST_COUNT),
      hiddenCount: 3
    });
  });
});
