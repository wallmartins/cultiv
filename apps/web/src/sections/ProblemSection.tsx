import { Container, SectionHeader } from "@my-ai-orchestrator/ui";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { ProblemPerspectiveRow } from "~/components/ProblemPerspectiveRow";
import { FullScreenSection } from "~/components/FullScreenSection";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { FallingLeavesLayer } from "~/visual/FallingLeavesLayer";
import { FragilePromptCollage } from "~/visual/scenes/FragilePromptCollage";
import { GenericOutputStack } from "~/visual/scenes/GenericOutputStack";

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
