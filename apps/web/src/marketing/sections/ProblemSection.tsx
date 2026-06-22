import { Container, SectionHeader } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { ProblemPerspectiveRow } from "~/marketing/components/ProblemPerspectiveRow";
import { FullScreenSection } from "~/marketing/components/FullScreenSection";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";

export interface ProblemSectionProps {
  readonly locale: MarketingLocale;
}

export function ProblemSection({ locale }: ProblemSectionProps) {
  const { problem, scenes } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <FullScreenSection
      id="problema"
      className="imprint-grain bg-paper press-edge relative overflow-hidden border-t border-ink-ghost"
    >
      <Container ref={sectionRef} className="relative z-[3] space-y-16 md:space-y-24">
        <div data-section-item>
          <SectionHeader eyebrow={problem.eyebrow} title={problem.title} className="mb-0" />
        </div>
        <ProblemPerspectiveRow
          index={problem.perspectives[0].index}
          title={problem.perspectives[0].title}
          body={problem.perspectives[0].body}
          proofLabel={scenes.genericOutput.repeatToneLabel}
          proofLines={scenes.genericOutput.lines}
        />
        <ProblemPerspectiveRow
          index={problem.perspectives[1].index}
          title={problem.perspectives[1].title}
          body={problem.perspectives[1].body}
          proofLabel={scenes.fragilePrompt.newChatHint}
          proofLines={scenes.fragilePrompt.fragments}
          reverse
        />
      </Container>
    </FullScreenSection>
  );
}
