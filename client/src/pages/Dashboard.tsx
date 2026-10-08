import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { Async, Bar, Empty, PageHeader } from "../components/ui";
import BookingItem from "../components/BookingItem";
import { peso, today } from "../lib/format";
import type { Booking, Overview, Utilization } from "../types";

export default function Dashboard() {
  const ov = useFetch<Overview>("/reports/overview");
  const todays = useFetch<Booking[]>(`/bookings?date=${today()}`);
  const overdue = useFetch<Booking[]>("/bookings?overdue=true");
  const util = useFetch<Utilization[]>("/reports/utilization");
  const all = [ov, todays, overdue, util];
  const retry = () => all.forEach((x) => x.refetch());
  const cards = ov.data && [
    ["Collected", peso(ov.data.collected)],
    ["Still owed", peso(ov.data.outstanding)],
    ["Overdue payments", String(ov.data.overdueCount)],
    ["Bookings today", String(todays.data?.length ?? 0)],
  ];
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="What's booked, what's paid and what's late."
        actions={
          <Link to="/bookings/new" className="btn btn-spot">
            New booking
          </Link>
        }
      />
      <Async
        loading={all.some((x) => x.loading)}
        error={all.find((x) => x.error)?.error ?? null}
        retry={retry}
      >
        {cards && todays.data && overdue.data && util.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {cards.map(([l, v]) => (
                <div
                  key={l}
                  className="card !p-4 sm:!p-5 border-l-4 border-l-brand-500 transition hover:-translate-y-1 hover:shadow-card"
                >
                  <p className="text-sm text-ink-500">{l}</p>
                  <p className="mt-1 break-words font-display text-3xl font-extrabold">
                    {v}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
              <section className="card transition hover:shadow-card lg:col-span-3">
                <h2 className="flex items-center justify-between text-xl font-bold">
                  Today's schedule
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-sm font-medium text-ink-500">
                    {todays.data.length}
                  </span>
                </h2>
                {todays.data.length === 0 ? (
                  <Empty
                    title="Nothing booked today"
                    hint="Open the calendar to fill a free slot."
                    action={
                      <Link to="/calendar" className="btn btn-primary">
                        Open calendar
                      </Link>
                    }
                  />
                ) : (
                  <ul className="mt-1 divide-y divide-line">
                    {todays.data.map((b) => (
                      <BookingItem key={b.id} booking={b} />
                    ))}
                  </ul>
                )}
              </section>
              <div className="space-y-6 lg:col-span-2">
                <section className="card">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-alert-600" />
                    Overdue payments ({overdue.data.length})
                  </h2>
                  {overdue.data.length === 0 ? (
                    <p className="mt-2 text-ink-500">
                      No one is behind on payments.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {overdue.data.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-3 rounded-lg border-l-4 border-l-alert-600 bg-alert-100 p-3 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            <b>{b.renterName}</b> · {b.studioName}
                          </span>
                          <b className="shrink-0 text-alert-700">
                            {peso(b.balanceDue)}
                          </b>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/payments" className="btn btn-ghost mt-4">
                    Go to payments
                  </Link>
                </section>
                <section className="card">
                  <h2 className="text-xl font-bold">
                    Studio use, last 14 days
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {util.data.map((u) => (
                      <li key={u.studioId}>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">{u.name}</span>
                          <span>
                            {u.bookedHours} of {u.availableHours} hrs ·{" "}
                            {u.utilization}%
                          </span>
                        </div>
                        <Bar percent={u.utilization} />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}
      </Async>
    </>
  );
}
