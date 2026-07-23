import "./locked.css";
import { Mono, Pill } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { DemoGeneration, type DemoGenerationProps } from "./DemoGeneration.js";

export interface LockedCenterProps {
  readonly onCalibrate: () => void;
  readonly demo?: DemoGenerationProps;
}

export function LockedCenter({ onCalibrate, demo }: LockedCenterProps) {
  const t = useMessages();
  return (
    <div className="locked-center">
      <div className="locked-center-cta-bar">
        <Mono className="locked-center-cta-label">{t.states.locked.lockedCenter.notice}</Mono>
        <Pill variant="primary" onClick={onCalibrate}>
          {t.states.locked.lockedCenter.calibrateCta}
        </Pill>
      </div>
      <div className="locked-center-body">
        <DemoGeneration {...demo} />
      </div>
    </div>
  );
}
