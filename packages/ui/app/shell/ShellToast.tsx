import { Mono, StatusDot } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";

export interface ShellToastProps {
  readonly text: string;
  readonly onClick?: () => void;
}

export function ShellToast({ text, onClick }: ShellToastProps) {
  const t = useMessages();
  return (
    <div className="shell-toast" onClick={onClick} role={onClick ? "button" : "status"} tabIndex={onClick ? 0 : undefined}>
      <StatusDot tone="live" pulse />
      <span className="shell-toast-text">{text}</span>
      {onClick ? (
        <Mono as="span" className="shell-toast-action">
          {t.shell.toastOpen}
        </Mono>
      ) : null}
    </div>
  );
}
