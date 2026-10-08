import { useFetch } from '../hooks/useFetch';
import { Async, Bar, Empty, PageHeader } from '../components/ui';
import BookingItem from '../components/BookingItem';
import { peso } from '../lib/format';
import type { Booking, Overview, Utilization } from '../types';

export default function Reports() {
  const ov = useFetch<Overview>('/reports/overview');
  const util = useFetch<Utilization[]>('/reports/utilization');
  const months = useFetch<{ month: string; total: number }[]>('/reports/revenue-by-month');
  const overdue = useFetch<Booking[]>('/reports/overdue');
  const all = [ov, util, months, overdue];
  const topRevenue = Math.max(1, ...(util.data?.map((u) => u.revenue) ?? [1]));
  const topMonth = Math.max(1, ...(months.data?.map((m) => m.total) ?? [1]));
  return (
    <>
      <PageHeader title="Revenue and utilization" subtitle="Which rooms earn, which sit empty, and who is late." />
      <Async loading={all.some((x) => x.loading)} error={all.find((x) => x.error)?.error ?? null} retry={() => all.forEach((x) => x.refetch())}>
        {ov.data && util.data && months.data && overdue.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[['Booked value', peso(ov.data.booked)], ['Collected', peso(ov.data.collected)], ['Still owed', peso(ov.data.outstanding)], ['Bookings', String(ov.data.bookings)]].map(([l, v]) => (
                <div key={l} className="card !p-4 sm:!p-5"><p className="text-sm text-ink-500">{l}</p><p className="mt-1 break-words font-display text-2xl font-extrabold">{v}</p></div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card">
                <h2 className="text-xl font-bold">Revenue by studio</h2>
                <ul className="mt-4 space-y-4">{util.data.map((u) => <li key={u.studioId}><div className="flex justify-between gap-2 text-sm"><span className="truncate font-semibold">{u.name}</span><span className="shrink-0">{peso(u.revenue)} · {u.bookings} bookings</span></div><Bar percent={(u.revenue / topRevenue) * 100} /></li>)}</ul>
              </section>
              <section className="card">
                <h2 className="text-xl font-bold">Utilization, last 14 days</h2>
                <ul className="mt-4 space-y-4">{util.data.map((u) => <li key={u.studioId}><div className="flex justify-between gap-2 text-sm"><span className="truncate font-semibold">{u.name}</span><span className="shrink-0">{u.bookedHours} of {u.availableHours} hrs · {u.utilization}%</span></div><Bar percent={u.utilization} tone="spot" /></li>)}</ul>
              </section>
            </div>
            <section className="card">
              <h2 className="text-xl font-bold">Collected by month</h2>
              {months.data.length === 0 ? <Empty title="No payments yet" hint="Revenue appears once payments are recorded." /> : (
                <ul className="mt-4 space-y-4">{months.data.map((m) => <li key={m.month}><div className="flex justify-between text-sm"><span className="font-semibold">{m.month}</span><span>{peso(m.total)}</span></div><Bar percent={(m.total / topMonth) * 100} /></li>)}</ul>
              )}
            </section>
            <section className="card">
              <h2 className="text-xl font-bold">Overdue bookings</h2>
              {overdue.data.length === 0 ? <p className="mt-2 text-ink-500">No overdue payments.</p> : <ul className="mt-1 divide-y divide-line">{overdue.data.map((b) => <BookingItem key={b.id} booking={b} showDate />)}</ul>}
            </section>
          </div>
        )}
      </Async>
    </>
  );
}
