import type { ReactNode } from "react";
import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useDrawStroke } from "~/animations/use-draw-stroke";
import { useDifferentiatorChapters } from "~/animations/use-differentiator-chapters";
import { useSectionReveal } from "~/animations/use-section-reveal";
import { ChapterPanel } from "~/components/differentiators/ChapterPanel";
import { ShowcaseTeaserPanel } from "~/components/differentiators/ShowcaseTeaserPanel";
import { getLinkedInShowcaseSample } from "~/content/showcase/get-linkedin-sample";
import { useIsMdUp } from "~/hooks/use-media-query";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import { IllustrationFrame } from "~/visual/IllustrationFrame";
import { ProblemSceneMat } from "~/visual/ProblemSceneMat";
import { WaveformScript } from "~/visual/illustrations/WaveformScript";
import { BriefingScene } from "~/visual/scenes/BriefingScene";
import { PreviewConfidenceScene } from "~/visual/scenes/PreviewConfidenceScene";
import { TeachVoiceScene } from "~/visual/scenes/TeachVoiceScene";

export interface DifferentiatorsSectionProps {
  readonly locale: MarketingLocale;
}

function MobileChapterBlock({
  index,
  title,
  body,
  visual,
  children
}: {
  readonly index: string;
  readonly title: string;
  readonly body: string;
  readonly visual?: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <article data-section-item className="space-y-6 border border-foreground/15 bg-surface-elevated p-6 md:p-8">
      <Text as="p" variant="meta" className="text-moss">
        [{index}]
      </Text>
      <Text as="h3" variant="h3" className="text-xl">
        {title}
      </Text>
      <Text as="p" variant="body" className="text-muted">
        {body}
      </Text>
      {visual}
      {children}
    </article>
  );
}

export function DifferentiatorsSection({ locale }: DifferentiatorsSectionProps) {
  const messages = getLocaleMessages(locale);
  const { differentiators, showcase, scenes } = messages;
  const linkedInSample = getLinkedInShowcaseSample(locale);
  const isDesktop = useIsMdUp();
  const { sectionRef, stackRef } = useDifferentiatorChapters<HTMLElement>(isDesktop);
  const mobileRevealRef = useSectionReveal("[data-section-item]", { start: "top bottom" });
  const waveformRef = useDrawStroke<HTMLDivElement>();

  const chapters = differentiators.chapters;
  const waveform = (
    <IllustrationFrame ref={waveformRef} className="max-w-xl text-showcase-muted">
      <WaveformScript className="h-auto w-full" script={showcase.waveformScript} />
    </IllustrationFrame>
  );

  if (!isDesktop) {
    return (
      <section
        id="diferenciais"
        ref={mobileRevealRef}
        className="differentiators-section editorial-rule bg-surface py-[var(--spacing-section-sm)] md:py-[var(--spacing-section)]"
      >
        <Container className="space-y-10">
          <div data-section-item>
            <SectionHeader
              eyebrow={differentiators.eyebrow}
              title={differentiators.title}
              className="mb-0"
            />
          </div>
          <div className="space-y-8">
            <article
              data-section-item
              className="space-y-6 bg-showcase p-6 text-showcase-foreground md:p-8"
            >
              <Text as="p" variant="meta" className="text-showcase-accent">
                [{chapters[0].index}]
              </Text>
              <Text as="h3" variant="display-sm">
                {chapters[0].title}
              </Text>
              <Text as="p" variant="body-lg" className="text-showcase-muted">
                {chapters[0].body}
              </Text>
              {waveform}
              <ShowcaseTeaserPanel sample={linkedInSample} showcase={showcase} />
            </article>
            <MobileChapterBlock
              index={chapters[1].index}
              title={chapters[1].title}
              body={chapters[1].body}
              visual={<TeachVoiceScene copy={scenes.teachVoice} className="mx-auto" />}
            />
            <MobileChapterBlock
              index={chapters[2].index}
              title={chapters[2].title}
              body={chapters[2].body}
              visual={
                <ProblemSceneMat className="w-full">
                  <BriefingScene copy={scenes.briefing} />
                </ProblemSceneMat>
              }
            />
            <MobileChapterBlock
              index={chapters[3].index}
              title={chapters[3].title}
              body={chapters[3].body}
              visual={
                <ProblemSceneMat className="w-full">
                  <PreviewConfidenceScene copy={scenes.previewConfidence} />
                </ProblemSceneMat>
              }
            />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="diferenciais" ref={sectionRef} className="relative overflow-x-clip">
      <div ref={stackRef} className="relative h-svh w-full">
        <ChapterPanel
          pinned
          index={chapters[0].index}
          title={chapters[0].title}
          body={chapters[0].body}
          variant="showcase"
          visual={waveform}
        >
          <ShowcaseTeaserPanel sample={linkedInSample} showcase={showcase} />
        </ChapterPanel>
        <ChapterPanel
          pinned
          index={chapters[1].index}
          title={chapters[1].title}
          body={chapters[1].body}
          visualEmphasis="prominent"
          visual={<TeachVoiceScene copy={scenes.teachVoice} className="lg:scale-[1.04] lg:origin-center" />}
        />
        <ChapterPanel
          pinned
          index={chapters[2].index}
          title={chapters[2].title}
          body={chapters[2].body}
          visualEmphasis="prominent"
          visual={
            <ProblemSceneMat className="w-full">
              <BriefingScene copy={scenes.briefing} />
            </ProblemSceneMat>
          }
        />
        <ChapterPanel
          pinned
          index={chapters[3].index}
          title={chapters[3].title}
          body={chapters[3].body}
          visualEmphasis="prominent"
          visual={
            <ProblemSceneMat className="w-full">
              <PreviewConfidenceScene copy={scenes.previewConfidence} />
            </ProblemSceneMat>
          }
        />
      </div>
    </section>
  );
}
