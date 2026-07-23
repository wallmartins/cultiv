/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { useUiLanguage } from "@my-ai-orchestrator/shared";
import { I18nProvider } from "@my-ai-orchestrator/ui/app/i18n";
import { WritingCenter } from "@my-ai-orchestrator/ui/app/detail";

// The chain under test spans three packages and no single surface owns it end to end:
//   settings LanguageToggle → useUiLanguage (shared, persisted) → app.tsx → I18nProvider → copy.
// app.tsx is the only place it is assembled, so this harness mirrors that one wiring line.
function Harness() {
  const language = useUiLanguage((state) => state.language);
  return (
    <I18nProvider locale={language}>
      <WritingCenter percent={40} topic="Um tema" />
    </I18nProvider>
  );
}

describe("switching the interface language", () => {
  it("re-renders the app's copy when the stored preference changes", () => {
    act(() => useUiLanguage.setState({ language: "pt-BR" }));
    render(<Harness />);
    expect(screen.getByText("escrevendo com a sua voz…")).toBeInTheDocument();

    act(() => useUiLanguage.setState({ language: "en" }));
    expect(screen.getByText("writing in your voice…")).toBeInTheDocument();
    expect(screen.queryByText("escrevendo com a sua voz…")).not.toBeInTheDocument();

    act(() => useUiLanguage.setState({ language: "pt-BR" }));
    expect(screen.getByText("escrevendo com a sua voz…")).toBeInTheDocument();
  });

  it("sets the document language so screen readers switch pronunciation", () => {
    act(() => useUiLanguage.setState({ language: "en" }));
    render(<Harness />);
    expect(document.documentElement.lang).toBe("en");

    act(() => useUiLanguage.setState({ language: "pt-BR" }));
    expect(document.documentElement.lang).toBe("pt-BR");
  });
});
