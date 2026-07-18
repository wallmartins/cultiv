import { Mono, Pill, Serif } from "../primitives/index.js";

export interface RevokeConfirmDialogProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function RevokeConfirmDialog({ open, onCancel, onConfirm }: RevokeConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="voice-revoke-backdrop" onClick={onCancel}>
      <div className="voice-revoke-dialog" onClick={(event) => event.stopPropagation()}>
        <Mono as="div" className="voice-revoke-dialog-eyebrow">
          ação destrutiva
        </Mono>
        <Serif as="div" size="1.5rem" lineHeight="1.25" className="voice-revoke-dialog-title">
          Revogar o consentimento apaga a sua voz
        </Serif>
        <div className="voice-revoke-dialog-body">
          O perfil de voz e a análise das suas amostras são apagados de forma permanente, e a geração é
          desligada. Seu histórico e a sua conta continuam. Pra voltar a gerar, será preciso conceder de novo e
          recalibrar.
        </div>
        <div className="voice-revoke-dialog-actions">
          <Pill variant="secondary" onClick={onCancel}>
            Manter minha voz
          </Pill>
          <Pill variant="danger" onClick={onConfirm}>
            Revogar e apagar
          </Pill>
        </div>
      </div>
    </div>
  );
}
