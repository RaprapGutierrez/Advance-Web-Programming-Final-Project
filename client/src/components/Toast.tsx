import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Kind = 'success' | 'error';
interface Item { id: number; message: string; kind: Kind }
const ToastCtx = createContext<(message: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((message: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, message, kind }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-card ${t.kind === 'success' ? 'bg-brand-700' : 'bg-coral-600'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
