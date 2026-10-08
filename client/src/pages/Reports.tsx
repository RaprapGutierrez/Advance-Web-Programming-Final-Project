import { useFetch } from "../hooks/useFetch";
import { Async, Bar, Empty, PageHeader } from "../components/ui";
import BookingItem from "../components/BookingItem";
import { peso } from "../lib/format";
import type { Booking, Overview, Utilization } from "../types";

const monthLabel = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card !p-4 sm:!p-5 border-l-4 border-l-brand-500 transition hover:-translate-y-1 hover:shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-2 break-words font-display text-3xl font-extrabold">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export default function Reports() {
  const ov = useFetch<Overview>("/reports/overview");
  const util = useFetch<Utilization[]>("/reports/utilization");
  const months = useFetch<{ month: string; total: number }[]>(
    "/reports/revenue-by-month",
  );
  const overdue = useFetch<Booking[]>("/reports/overdue");
  const all = [ov, util, months, overdue];

  const byRevenue = util.data
    ? [...util.data].sort((a, b) => b.revenue - a.revenue)
    : [];
  const byUse = util.data
    ? [...util.data].sort((a, b) => b.utilization - a.utilization)
    : [];
  const totalRevenue = byRevenue.reduce((s, u) => s + u.revenue, 0);
  const topRevenue = Math.max(1, ...byRevenue.map((u) => u.revenue));
  const topMonth = Math.max(1, ...(months.data?.map((m) => m.total) ?? [1]));
  const rate =
    ov.data && ov.data.booked > 0
      ? Math.round((ov.data.collected / ov.data.booked) * 100)
      : 0;
  const avg =
    ov.data && ov.data.bookings > 0 ? ov.data.booked / ov.data.bookings : 0;

  return (
    <>
      <PageHeader
        title="Revenue and utilization"
        subtitle="Which rooms earn, which sit empty, and who is late."
      />
      <Async
        loading={all.some((x) => x.loading)}
        error={all.find((x) => x.error)?.error ?? null}
        retry={() => all.forEach((x) => x.refetch())}
      >
        {ov.data && util.data && months.data && overdue.data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Booked value" value={peso(ov.data.booked)} />
              <Stat
                label="Collected"
                value={peso(ov.data.collected)}
                hint={`${rate}% of booked value`}
              />
              <Stat label="Still owed" value={peso(ov.data.outstanding)} />
              <Stat
                label="Bookings"
                value={String(ov.data.bookings)}
                hint={`${peso(avg)} average each`}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card transition hover:shadow-card">
                <h2 className="text-xl font-bold">Revenue by studio</h2>
                <p className="text-sm text-ink-500">
                  Ranked, with share of total.
                </p>
                <ul className="mt-4 space-y-4">
                  {byRevenue.map((u, i) => (
                    <li key={u.studioId}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="truncate font-semibold">
                          <span className="mr-2 text-ink-500">{i + 1}</span>
                          {u.name}
                        </span>
                        <span className="shrink-0">
                          <b>{peso(u.revenue)}</b>
                          <span className="text-ink-500">
                            {" "}
                            ·{" "}
                            {totalRevenue
                              ? Math.round((u.revenue / totalRevenue) * 100)
                              : 0}
                            %
                          </span>
                        </span>
                      </div>
                      <Bar percent={(u.revenue / topRevenue) * 100} />
                      <p className="mt-1 text-xs text-ink-500">
                        {u.bookings} bookings
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card transition hover:shadow-card">
                <h2 className="text-xl font-bold">Utilization, last 14 days</h2>
                <p className="text-sm text-ink-500">
                  Booked hours vs. available hours.
                </p>
                <ul className="mt-4 space-y-4">
                  {byUse.map((u) => (
                    <li key={u.studioId}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-semibold">{u.name}</span>
                        <span className="shrink-0 font-display text-lg font-extrabold">
                          {u.utilization}%
                        </span>
                      </div>
                      <Bar percent={u.utilization} tone="spot" />
                      <p className="mt-1 text-xs text-ink-500">
                        {u.bookedHours} of {u.availableHours} hrs
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="card transition hover:shadow-card">
              <h2 className="text-xl font-bold">Collected by month</h2>
              {months.data.length === 0 ? (
                <Empty
                  title="No payments yet"
                  hint="Revenue appears once payments are recorded."
                />
              ) : (
                <ul className="mt-4 space-y-4">
                  {months.data.map((m, i, arr) => {
                    const prev = i > 0 ? (arr[i - 1]?.total ?? null) : null;
                    const change =
                      prev && prev > 0
                        ? Math.round(((m.total - prev) / prev) * 100)
                        : null;
                    return (
                      <li key={m.month}>
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="font-semibold">
                            {monthLabel(m.month)}
                          </span>
                          <span>
                            <b>{peso(m.total)}</b>
                            {change !== null && (
                              <span
                                className={`ml-2 text-xs font-semibold ${
                                  change >= 0
                                    ? "text-green-700"
                                    : "text-alert-700"
                                }`}
                              >
                                {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
                              </span>
                            )}
                          </span>
                        </div>
                        <Bar percent={(m.total / topMonth) * 100} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="card">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    overdue.data.length > 0 ? "bg-alert-600" : "bg-green-500"
                  }`}
                />
                Overdue bookings ({overdue.data.length})
              </h2>
              {overdue.data.length === 0 ? (
                <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
                  ✓ No overdue payments.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-line">
                  {overdue.data.map((b) => (
                    <BookingItem key={b.id} booking={b} showDate />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Async>
    </>
  );
}
