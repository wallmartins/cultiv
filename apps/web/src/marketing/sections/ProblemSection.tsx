import { Container, SectionHeader } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/marketing/animations/use-section-reveal";
import { ProblemPerspectiveRow } from "~/marketing/components/ProblemPerspectiveRow";
import { FullScreenSection } from "~/marketing/components/FullScreenSection";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { FallingLeavesLayer } from "~/marketing/visual/FallingLeavesLayer";
import { FragilePromptCollage } from "~/marketing/visual/scenes/FragilePromptCollage";
import { GenericOutputStack } from "~/marketing/visual/scenes/GenericOutputStack";

export interface ProblemSectionProps {
  readonly locale: MarketingLocale;
}

export function ProblemSection({ locale }: ProblemSectionProps) {
  const { problem, scenes } = getLocaleMessages(locale);
  const sectionRef = useSectionReveal("[data-section-item]");

  return (
    <FullScreenSection id="problema" className="editorial-rule relative overflow-hidden">
      <FallingLeavesLayer density="sparse" className="z-[2]" />
      <Container ref={sectionRef} className="relative z-[3] space-y-16 md:space-y-24">
        <div data-section-item>
          <SectionHeader eyebrow={problem.eyebrow} title={problem.title} className="mb-0" />
        </div>
        <ProblemPerspectiveRow
          index={problem.perspectives[0].index}
          title={problem.perspectives[0].title}
          body={problem.perspectives[0].body}
          visual={<GenericOutputStack copy={scenes.genericOutput} />}
        />
        <ProblemPerspectiveRow
          index={problem.perspectives[1].index}
          title={problem.perspectives[1].title}
          body={problem.perspectives[1].body}
          visual={<FragilePromptCollage copy={scenes.fragilePrompt} />}
          reverse
        />
      </Container>
    </FullScreenSection>
  );
}
