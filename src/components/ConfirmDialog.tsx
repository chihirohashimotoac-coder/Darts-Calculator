import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 誤操作防止用の確認ダイアログ。 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog__backdrop" data-testid="confirm-dialog-backdrop">
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        data-testid="confirm-dialog"
      >
        <h2 className="confirm-dialog__title" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="confirm-dialog__message" id="confirm-dialog-message">
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            ref={cancelRef}
            className="confirm-dialog__button"
            data-testid="confirm-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog__button confirm-dialog__button--danger"
            data-testid="confirm-accept"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
