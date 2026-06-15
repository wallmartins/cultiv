export interface OutputWordTarget {
  readonly minWords: number;
  readonly maxWords: number;
  readonly idealWords: number;
}

const DEFAULT_TARGET: OutputWordTarget = {
  minWords: 250,
  maxWords: 900,
  idealWords: 500
};

const CONTENT_TYPE_TARGETS: ReadonlyArray<{
  readonly match: (formatName: string) => boolean;
  readonly target: OutputWordTarget;
}> = [
  {
    match: (name) => name.includes("linkedin"),
    target: { minWords: 130, maxWords: 220, idealWords: 170 }
  },
  {
    match: (name) => name.includes("newsletter"),
    target: { minWords: 400, maxWords: 650, idealWords: 500 }
  },
  {
    match: (name) => name.includes("architecture"),
    target: { minWords: 1500, maxWords: 2500, idealWords: 1900 }
  },
  {
    match: (name) => name.includes("blog"),
    target: { minWords: 1500, maxWords: 2500, idealWords: 1800 }
  },
  {
    match: (name) => name.includes("thread") || name.includes("twitter"),
    target: { minWords: 180, maxWords: 420, idealWords: 280 }
  },
  {
    match: (name) => name.includes("post"),
    target: { minWords: 500, maxWords: 1200, idealWords: 800 }
  }
];

export function resolveOutputWordTargetForFormatName(formatName: string): OutputWordTarget {
  const normalized = formatName.toLowerCase();
  const match = CONTENT_TYPE_TARGETS.find((entry) => entry.match(normalized));
  return match?.target ?? DEFAULT_TARGET;
}

export function describeOutputWordTarget(target: OutputWordTarget): string {
  return `${target.minWords}-${target.maxWords} words, ideally around ${target.idealWords} words`;
}
