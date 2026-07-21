import { randomUUID } from "node:crypto";
import {
  CALIBRATION_WIZARD_STEPS,
  type WizardStepId
} from "@my-ai-orchestrator/domain";
import type {
  VoiceCalibrationSessionStatus,
  VoiceCalibrationStepState,
  WizardContext
} from "@my-ai-orchestrator/contracts";
import { buildStepPrompt } from "./voice-calibration-candidates.js";

const sessions = new Map<string, VoiceCalibrationSessionRecord>();

export interface VoiceCalibrationSessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  status: VoiceCalibrationSessionStatus;
  context?: WizardContext;
  currentStepId: WizardStepId;
  steps: VoiceCalibrationStepState[];
  exampleIdsByStepId: Record<string, string>;
  readonly createdAt: string;
  updatedAt: string;
}

function buildInitialSteps(context?: WizardContext): VoiceCalibrationStepState[] {
  return CALIBRATION_WIZARD_STEPS.map((step) => {
    const built = buildStepPrompt(step.id, context);
    return {
      stepId: step.id,
      theme: built.theme,
      prompt: built.prompt
    };
  });
}

export function createVoiceCalibrationSession(userId: string, now: () => Date): VoiceCalibrationSessionRecord {
  const timestamp = now().toISOString();
  const session: VoiceCalibrationSessionRecord = {
    sessionId: `voice-calibration:${randomUUID()}`,
    userId,
    status: "in_progress",
    currentStepId: CALIBRATION_WIZARD_STEPS[0]!.id,
    steps: buildInitialSteps(),
    exampleIdsByStepId: {},
    createdAt: timestamp,
    updatedAt: timestamp
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getVoiceCalibrationSession(
  sessionId: string
): VoiceCalibrationSessionRecord | undefined {
  return sessions.get(sessionId);
}

export function listVoiceCalibrationSessionsByUser(userId: string): readonly VoiceCalibrationSessionRecord[] {
  return [...sessions.values()].filter((session) => session.userId === userId);
}

export function countCompletedVoiceCalibrationSessions(userId: string): number {
  return listVoiceCalibrationSessionsByUser(userId).filter((session) => session.status === "completed")
    .length;
}

export function saveVoiceCalibrationSession(session: VoiceCalibrationSessionRecord): void {
  sessions.set(session.sessionId, session);
}

export function refreshSessionStepPrompts(
  session: VoiceCalibrationSessionRecord,
  now: () => Date
): void {
  session.steps = session.steps.map((stepState) => {
    if (stepState.submittedAt !== undefined || stepState.skipped) {
      return stepState;
    }

    const built = buildStepPrompt(stepState.stepId as WizardStepId, session.context);
    return {
      ...stepState,
      theme: built.theme,
      prompt: built.prompt
    };
  });
  session.updatedAt = now().toISOString();
}

export function resetVoiceCalibrationSessionStore(): void {
  sessions.clear();
}
