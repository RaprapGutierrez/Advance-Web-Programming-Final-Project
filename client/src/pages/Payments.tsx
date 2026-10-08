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
  const refresh = () => {
    due.refetch();
    paid.refetch();
  };
  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await api.delete(`/payments/${del.id}`);
      toast('Payment deleted');
      setDel(null);
      refresh();
    } catch (e) {
      toast(errMsg(e), 'error');
      setDel(null);
    } finally {
      setBusy(false);
    }
  }
  const totalDue = due.data?.reduce((s, b) => s + b.balanceDue, 0) ?? 0;
  const totalPaid = paid.data?.reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Collect what's owed and review what came in."
      />
      <Async
        loading={due.loading || paid.loading}
        error={due.error ?? paid.error}
        retry={refresh}
      >
        {due.data && paid.data && (
          <div className="space-y-8">
            {/* Summary: what's owed vs. what's come in */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card">
                <p className="text-sm text-ink-500">Still to collect</p>
                <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-alert-600">
                  {peso(totalDue)}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  across {due.data.length}{' '}
                  {due.data.length === 1 ? 'booking' : 'bookings'}
                </p>
              </div>
              <div className="card">
                <p className="text-sm text-ink-500">Collected</p>
                <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">
                  {peso(totalPaid)}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  from {paid.data.length}{' '}
                  {paid.data.length === 1 ? 'payment' : 'payments'}
                </p>
              </div>
            </div>

            {/* Balances to collect */}
            <section className="card !p-0 overflow-hidden">
              <header className="border-b border-line px-6 py-5">
                <h2 className="text-xl font-bold tracking-tight">
                  Balances to collect
                </h2>
              </header>
              {due.data.length === 0 ? (
                <div className="px-6 py-2">
                  <Empty
                    title="All caught up"
                    hint="Confirmed bookings with a balance will appear here."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {due.data.map((b) => (
                    <li
                      key={b.id}
                      className={`flex flex-col gap-4 border-l-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${
                        b.overdue ? 'border-alert-600' : 'border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold">{b.renterName}</p>
                          <StatusBadge status={b.status} />
                          {b.overdue && (
                            <span className="badge bg-alert-600 text-white">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-500">
                          {b.studioName}
                        </p>
                        <p className="text-sm text-ink-500">
                          {fmtDate(b.date)}, {hourLabel(b.startHour)} to{' '}
                          {hourLabel(b.endHour)}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          Paid {peso(b.paid)} of {peso(b.total)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <p className="font-display text-2xl font-bold tracking-tight text-alert-600">
                          {peso(b.balanceDue)}
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => setPay(b)}
                        >
                          Record payment
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Payment history */}
            <section className="card !p-0 overflow-hidden">
              <header className="flex items-baseline justify-between border-b border-line px-6 py-5">
                <h2 className="text-xl font-bold tracking-tight">
                  Payment history
                </h2>
                {paid.data.length > 0 && (
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-sm text-ink-500">
                    {paid.data.length}
                  </span>
                )}
              </header>
              {paid.data.length === 0 ? (
                <div className="px-6 py-2">
                  <Empty
                    title="No payments yet"
                    hint="Recorded payments will be listed here."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {paid.data.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold">{p.renterName}</p>
                        <p className="text-sm text-ink-500">{p.studioName}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
                          <span>{fmtDate(p.date)}</span>
                          <span className="rounded-full border border-line px-2 py-0.5 text-xs capitalize">
                            {p.method}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <b className="font-display text-xl tracking-tight">
                          {peso(p.amount)}
                        </b>
                        <button
                          className="btn btn-ghost px-3 py-1.5 text-alert-600"
                          onClick={() => setDel(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Async>
      {pay && (
        <PaymentModal
          booking={pay}
          onClose={() => setPay(null)}
          onSaved={refresh}
        />
      )}
      <ConfirmDialog
        open={!!del}
        busy={busy}
        title="Delete this payment?"
        message={`${peso(del?.amount ?? 0)} will be added back to the renter's balance.`}
        onConfirm={remove}
        onCancel={() => setDel(null)}
      />
    </>
  );
}