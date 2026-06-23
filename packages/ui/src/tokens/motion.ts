export const motionTokens = {
  easing: {
    default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    easeOut: "cubic-bezier(0.25, 0.1, 0.25, 1)"
  },
  duration: {
    instant: 0,
    fast: 200,
    normal: 300,
    reveal: 400,
    routeDraw: 1200,
    drawer: 350,
    logoBreath: 4000
  },
  distance: {
    revealY: 12,
    wizardSlide: 24,
    cardHover: 2
  }
} as const;
