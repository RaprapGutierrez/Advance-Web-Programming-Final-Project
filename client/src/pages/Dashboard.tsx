import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { Async, Bar, Empty, PageHeader } from "../components/ui";
import BookingItem from "../components/BookingItem";
import { peso, today } from "../lib/format";
import type { Booking, Overview, Utilization } from "../types";

function Stat({
  label,
  value,
  hint,
  alert = false,
}: {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`card !p-4 sm:!p-5 border-l-4 transition hover:-translate-y-1 hover:shadow-card ${
        alert ? "border-l-alert-600 bg-alert-100" : "border-l-brand-500"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words font-display text-3xl font-extrabold ${
          alert ? "text-alert-700" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const ov = useFetch<Overview>("/reports/overview");
  const todays = useFetch<Booking[]>(`/bookings?date=${today()}`);
  const overdue = useFetch<Booking[]>("/bookings?overdue=true");
  const util = useFetch<Utilization[]>("/reports/utilization");
  const all = [ov, todays, overdue, util];
  const retry = () => all.forEach((x) => x.refetch());

  const dateLabel = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const rate =
    ov.data && ov.data.booked > 0
      ? Math.round((ov.data.collected / ov.data.booked) * 100)
      : 0;
  const sortedUtil = util.data
    ? [...util.data].sort((a, b) => b.utilization - a.utilization)
    : [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${dateLabel} · what's booked, what's paid and what's late.`}
        actions={
          <Link to="/bookings/new" className="btn btn-spot">
            + New booking
          </Link>
        }
      />
      <Async
        loading={all.some((x) => x.loading)}
        error={all.find((x) => x.error)?.error ?? null}
        retry={retry}
      >
        {ov.data && todays.data && overdue.data && util.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat
                label="Collected"
                value={peso(ov.data.collected)}
                hint={`${rate}% of booked value`}
              />
              <Stat label="Still owed" value={peso(ov.data.outstanding)} />
              <Stat
                label="Overdue payments"
                value={String(ov.data.overdueCount)}
                hint={
                  ov.data.overdueCount === 0
                    ? "All caught up"
                    : "Needs follow-up"
                }
                alert={ov.data.overdueCount > 0}
              />
              <Stat
                label="Bookings today"
                value={String(todays.data.length)}
                hint={dateLabel}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <section className="card transition hover:shadow-card lg:col-span-3">
                <h2 className="flex items-center justify-between text-xl font-bold">
                  Today's schedule
                  <span className="rounded-full bg-brand-500/10 px-3 py-0.5 text-sm font-semibold text-brand-500">
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
                  <ul className="mt-2 divide-y divide-line">
                    {todays.data.map((b) => (
                      <BookingItem key={b.id} booking={b} />
                    ))}
                  </ul>
                )}
                <Link to="/calendar" className="btn btn-ghost mt-4">
                  View full calendar
                </Link>
              </section>

              <div className="space-y-6 lg:col-span-2">
                <section className="card">
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        overdue.data.length > 0
                          ? "bg-alert-600"
                          : "bg-green-500"
                      }`}
                    />
                    Overdue payments ({overdue.data.length})
                  </h2>
                  {overdue.data.length === 0 ? (
                    <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
                      ✓ No one is behind on payments.
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
                  <ul className="mt-4 space-y-4">
                    {sortedUtil.map((u) => (
                      <li key={u.studioId}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {u.name}
                          </span>
                          <span className="shrink-0 font-display text-lg font-extrabold">
                            {u.utilization}%
                          </span>
                        </div>
                        <Bar percent={u.utilization} />
                        <p className="mt-1 text-xs text-ink-500">
                          {u.bookedHours} of {u.availableHours} hrs booked
                        </p>
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
