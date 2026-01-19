import { useState, useCallback, useMemo, useRef } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

interface DialogState extends ConfirmOptions {
  isOpen: boolean;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'default',
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        isOpen: true,
        ...options,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const dialogProps = useMemo(
    () => ({
      isOpen: dialogState.isOpen,
      title: dialogState.title,
      message: dialogState.message,
      confirmLabel: dialogState.confirmLabel,
      cancelLabel: dialogState.cancelLabel,
      variant: dialogState.variant,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    }),
    [dialogState, handleConfirm, handleCancel]
  );

  return {
    confirm,
    dialogProps,
  };
}
