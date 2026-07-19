import "./locked.css";
import { Mono, Pill } from "../primitives/index.js";
import { DemoGeneration, type DemoGenerationProps } from "./DemoGeneration.js";

export interface LockedCenterProps {
  readonly onCalibrate: () => void;
  readonly demo?: DemoGenerationProps;
}

export function LockedCenter({ onCalibrate, demo }: LockedCenterProps) {
  return (
    <div className="locked-center">
      <div className="locked-center-cta-bar">
        <Mono className="locked-center-cta-label">nenhuma geração real ainda — o exemplo abaixo é ilustrativo</Mono>
        <Pill variant="primary" onClick={onCalibrate}>
          Calibrar minha voz →
        </Pill>
      </div>
      <div className="locked-center-body">
        <DemoGeneration {...demo} />
      </div>
    </div>
  );
}
