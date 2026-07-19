import { Pill } from "../primitives/index.js";

export interface DeleteAccountRowProps {
  readonly onOpenDelete: () => void;
}

// Degrau terminal da escada destrutiva — label + Pill sólido, ambos em --danger em repouso.
export function DeleteAccountRow({ onOpenDelete }: DeleteAccountRowProps) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label is-danger">Excluir conta</div>
        <div className="settings-row-sub">terminal: remove tudo, inclusive o login</div>
      </div>
      <Pill variant="danger" onClick={onOpenDelete}>
        Excluir conta
      </Pill>
    </div>
  );
}
