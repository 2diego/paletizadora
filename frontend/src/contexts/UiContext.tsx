import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Toast } from '../components/Toast';
import { ConfirmModal, type ConfirmOptions } from '../components/ConfirmModal';

interface UiContextValue {
  showToast: (message: string) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirmClose = useCallback((value: boolean) => {
    setConfirmState((prev) => {
      if (prev) prev.resolve(value);
      return null;
    });
  }, []);

  return (
    <UiContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toastMessage !== null && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
      {confirmState && (
        <ConfirmModal
          open
          {...confirmState.options}
          onConfirm={() => handleConfirmClose(true)}
          onCancel={() => handleConfirmClose(false)}
        />
      )}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
