import type { ReactNode } from 'react';
import type { Status } from '../types';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-ink-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />{label}
    </div>
  );
}
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-alert-600/30 bg-alert-100 p-5 text-sm text-alert-700">
      <p className="font-semibold">That didn't load</p><p className="mt-1">{message}</p>
      {onRetry && <button className="btn btn-danger mt-3" onClick={onRetry}>Try again</button>}
    </div>
  );
}
export function Empty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-100 bg-white px-6 py-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function Async({ loading, error, retry, children }: { loading: boolean; error: string | null; retry?: () => void; children: ReactNode }) {
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={retry} />;
  return <>{children}</>;
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>{children}
      {error && <p className="mt-1.5 text-sm font-medium text-alert-600">{error}</p>}
    </div>
  );
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink-900/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="card my-8 w-full max-w-lg">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="btn btn-ghost px-3 py-1.5" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', cancelLabel = 'Keep it', busy, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-md">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-ink-500">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
const statusCls: Record<Status, string> = {
  pending: 'bg-spot-300/40 text-ink-900', confirmed: 'bg-brand-50 text-brand-700', paid: 'bg-ok-100 text-ok-600',
  completed: 'bg-ink-900 text-white', cancelled: 'bg-alert-100 text-alert-700',
};
export const StatusBadge = ({ status }: { status: Status }) => <span className={`badge capitalize ${statusCls[status]}`}>{status}</span>;
export const Bar = ({ percent, tone = 'brand' }: { percent: number; tone?: 'brand' | 'spot' }) => (
  <div className="h-3 overflow-hidden rounded-full bg-brand-50"><div className={`h-full rounded-full ${tone === 'brand' ? 'bg-brand-600' : 'bg-spot-400'}`} style={{ width: `${Math.min(100, Math.max(2, percent))}%` }} /></div>
);
