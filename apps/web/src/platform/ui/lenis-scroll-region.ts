/** Props for nested scroll regions so Lenis does not capture wheel events. */
export const lenisScrollRegionProps = {
  "data-lenis-prevent": "",
  "data-lenis-prevent-wheel": "",
  "data-lenis-prevent-touch": ""
} as const;

export const lenisScrollRegionClassName = "showcase-output-scroll overscroll-contain";
