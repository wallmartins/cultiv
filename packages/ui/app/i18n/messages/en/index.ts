import type { AppMessages } from "../types.js";
import { app } from "./app.js";
import { common } from "./common.js";
import { shell } from "./shell.js";
import { detail } from "./detail.js";
import { generate } from "./generate.js";
import { voice } from "./voice.js";
import { onboarding } from "./onboarding.js";
import { billing } from "./billing.js";
import { plans } from "./plans.js";
import { settings } from "./settings.js";
import { states } from "./states.js";
import { voiceSignals } from "./voice-signals.js";

export const en: AppMessages = {
  app,
  common,
  shell,
  detail,
  generate,
  voice,
  onboarding,
  billing,
  plans,
  settings,
  states,
  voiceSignals
};
