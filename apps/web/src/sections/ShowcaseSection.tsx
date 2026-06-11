import type { ReactNode } from "react";
import { Container, SectionHeader, Text } from "@my-ai-orchestrator/ui";
import { useHorizontalScrollPin } from "~/animations/use-horizontal-scroll-pin";
import { useDrawStroke } from "~/animations/use-draw-stroke";
import { ShowcaseSlide } from "~/components/ShowcaseSlide";
import { getShowcaseSamples } from "~/content/showcase/get-samples";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";
import type { ShowcaseSample } from "~/content/showcase/types";
import { IllustrationFrame } from "~/visual/IllustrationFrame";
import { WaveformScript } from "~/visual/illustrations/WaveformScript";

export interface ShowcaseSectionProps {
  readonly locale: MarketingLocale;
}

type ShowcaseCopy = ReturnType<typeof getLocaleMessages>["showcase"];

function ShowcaseHeader({
  showcase,
  waveformRef,
  showScrollHint
}: {
  readonly showcase: ShowcaseCopy;
  readonly waveformRef: ReturnType<typeof useDrawStroke<HTMLDivElement>>;
  readonly showScrollHint: boolean;
}) {
  return (
    <>
      <SectionHeader
        eyebrow={showcase.eyebrow}
        title={showcase.title}
        description={showcase.description}
        invert
      />
      <IllustrationFrame ref={waveformRef} className="mt-6 max-w-2xl text-showcase-muted">
        <WaveformScript className="h-auto w-full" script={showcase.waveformScript} />
      </IllustrationFrame>
      {showScrollHint ? (
        <Text as="p" variant="meta" className="mt-4 text-showcase-muted">
          {showcase.scrollHint}
        </Text>
      ) : null}
    </>
  );
}

function ShowcaseSlides({
  samples,
  showcase,
  layout
}: {
  readonly samples: readonly ShowcaseSample[];
  readonly showcase: ShowcaseCopy;
  readonly layout: "stacked" | "pinned";
}) {
  return (
    <>
      {samples.map((sample, index) => (
        <ShowcaseSlide
          key={sample.id}
          sample={sample}
          layout={layout}
          genericLabel={showcase.genericLabel}
          voiceLabel={showcase.voiceLabel}
          stampLabel={showcase.stampLabel}
          stampValue={showcase.stampValue}
          slideLabel={`[${String(index + 1).padStart(2, "0")}]`}
          viewFullSampleLabel={showcase.viewFullSample}
          closeModalLabel={showcase.closeModal}
          threadMorePostsLabel={showcase.threadMorePosts}
          proseMoreBlocksLabel={showcase.proseMoreBlocks}
          linkedInAuthorName={showcase.linkedInAuthorName}
          linkedInAuthorMeta={showcase.linkedInAuthorMeta}
        />
      ))}
    </>
  );
}

function ShowcasePinnedCarousel({
  samples,
  showcase,
  header
}: {
  readonly samples: readonly ShowcaseSample[];
  readonly showcase: ShowcaseCopy;
  readonly header: ReactNode;
}) {
  const { sectionRef, trackRef } = useHorizontalScrollPin<HTMLDivElement, HTMLDivElement>();

  return (
    <div ref={sectionRef} className="relative flex h-svh flex-col">
      <Container className="shrink-0 pt-10 pb-6 md:pt-14">{header}</Container>
      <div ref={trackRef} className="flex h-full min-h-0 items-stretch">
        <ShowcaseSlides samples={samples} showcase={showcase} layout="pinned" />
      </div>
    </div>
  );
}

export function ShowcaseSection({ locale }: ShowcaseSectionProps) {
  const { showcase } = getLocaleMessages(locale);
  const samples = getShowcaseSamples(locale);
  const stackedWaveformRef = useDrawStroke<HTMLDivElement>();
  const pinnedWaveformRef = useDrawStroke<HTMLDivElement>();

  const stackedHeader = (
    <ShowcaseHeader showcase={showcase} waveformRef={stackedWaveformRef} showScrollHint={false} />
  );
  const pinnedHeader = (
    <ShowcaseHeader showcase={showcase} waveformRef={pinnedWaveformRef} showScrollHint />
  );

  return (
    <section
      id="showcase"
      className="overflow-x-clip bg-showcase text-showcase-foreground editorial-rule"
    >
      <div className="block md:hidden motion-reduce:md:block">
        <Container className="space-y-10 py-[var(--spacing-section)] md:space-y-12">
          {stackedHeader}
          <div className="flex w-full flex-col">
            <ShowcaseSlides samples={samples} showcase={showcase} layout="stacked" />
          </div>
        </Container>
      </div>

      <div className="hidden md:block motion-reduce:md:hidden">
        <ShowcasePinnedCarousel samples={samples} showcase={showcase} header={pinnedHeader} />
      </div>
    </section>
  );
}
