import { useState, useCallback, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'default';
}

export function useConfirm() {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: 'Potwierdzenie',
    message: '',
    confirmLabel: 'Potwierdź',
    cancelLabel: 'Anuluj',
    variant: 'default',
  });

  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setDialogState({
      isOpen: true,
      title: opts.title ?? 'Potwierdzenie',
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'Potwierdź',
      cancelLabel: opts.cancelLabel ?? 'Anuluj',
      variant: opts.variant ?? 'default',
    });
    return new Promise(resolve => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  function ConfirmDialog() {
    return (
      <Modal
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        title={dialogState.title}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">{dialogState.message}</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button variant="secondary" onClick={handleCancel}>
              {dialogState.cancelLabel}
            </Button>
            <Button
              variant={dialogState.variant === 'danger' ? 'danger' : undefined}
              onClick={handleConfirm}
            >
              {dialogState.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return { confirm, ConfirmDialog };
}
