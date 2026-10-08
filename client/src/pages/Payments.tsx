import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, errMsg } from '../lib/api';
import { Async, ConfirmDialog, Empty, PageHeader, StatusBadge } from '../components/ui';
import { PaymentModal } from '../components/forms';
import { useToast } from '../components/Toast';
import { fmtDate, hourLabel, peso } from '../lib/format';
import type { Booking, Payment } from '../types';

export default function Payments() {
  const due = useFetch<Booking[]>('/bookings?hasBalance=true');
  const paid = useFetch<Payment[]>('/payments');
  const [pay, setPay] = useState<Booking | null>(null);
  const [del, setDel] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const refresh = () => { due.refetch(); paid.refetch(); };
  async function remove() {
    if (!del) return;
    setBusy(true);
    try { await api.delete(`/payments/${del.id}`); toast('Payment deleted'); setDel(null); refresh(); }
    catch (e) { toast(errMsg(e), 'error'); setDel(null); } finally { setBusy(false); }
  }
  const totalDue = due.data?.reduce((s, b) => s + b.balanceDue, 0) ?? 0;
  return (
    <>
      <PageHeader title="Payments" subtitle="Collect what's owed and review what came in." />
      <Async loading={due.loading || paid.loading} error={due.error ?? paid.error} retry={refresh}>
        {due.data && paid.data && (
          <div className="space-y-6">
            <section className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-bold">Balances to collect</h2><p className="font-display text-2xl font-extrabold text-alert-600">{peso(totalDue)}</p></div>
              {due.data.length === 0 ? <Empty title="All caught up" hint="Confirmed bookings with a balance will appear here." /> : (
                <ul className="mt-2 divide-y divide-line">
                  {due.data.map((b) => (
                    <li key={b.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{b.renterName}</p><StatusBadge status={b.status} />{b.overdue && <span className="badge bg-alert-600 text-white">Overdue</span>}</div>
                        <p className="text-sm text-ink-500">{b.studioName} · {fmtDate(b.date)} · {hourLabel(b.startHour)}–{hourLabel(b.endHour)} · paid {peso(b.paid)} of {peso(b.total)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end"><p className="font-display text-xl font-bold text-alert-600">{peso(b.balanceDue)}</p><button className="btn btn-primary" onClick={() => setPay(b)}>Record payment</button></div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">Payment history</h2>
              {paid.data.length === 0 ? <Empty title="No payments yet" hint="Recorded payments will be listed here." /> : (
                <ul className="mt-2 divide-y divide-line">
                  {paid.data.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <span className="min-w-0"><b>{p.renterName}</b> · {p.studioName}<br /><span className="text-ink-500">{fmtDate(p.date)} · <span className="capitalize">{p.method}</span></span></span>
                      <span className="flex items-center gap-3"><b className="font-display text-lg">{peso(p.amount)}</b><button className="btn btn-ghost px-3 py-1.5 text-alert-600" onClick={() => setDel(p)}>Delete</button></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Async>
      {pay && <PaymentModal booking={pay} onClose={() => setPay(null)} onSaved={refresh} />}
      <ConfirmDialog open={!!del} busy={busy} title="Delete this payment?" message={`${peso(del?.amount ?? 0)} will be added back to the renter's balance.`} onConfirm={remove} onCancel={() => setDel(null)} />
    </>
  );
}
