import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { Async, Empty, PageHeader } from "../components/ui";
import BookingItem from "../components/BookingItem";
import SlotGrid from "../components/SlotGrid";
import StudioSelect from "../components/StudioSelect";
import { fmtDate, shiftDate, today } from "../lib/format";
import { useAuth } from "../lib/auth";
import type { Availability, Booking, Studio } from "../types";

export default function Calendar() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const isOwner = useAuth().hasRole("owner");
  const [todayOn, setTodayOn] = useState(false);
  const studios = useFetch<Studio[]>("/studios");
  const date = sp.get("date") ?? today();
  const studioId = sp.get("studio") ?? studios.data?.[0]?.id ?? null;
  const avail = useFetch<Availability>(
    studioId ? `/studios/${studioId}/availability?date=${date}` : null,
  );
  const bookings = useFetch<Booking[]>(`/bookings?date=${date}`);
  const set = (patch: Record<string, string>) =>
    setSp({ date, ...(studioId ? { studio: studioId } : {}), ...patch });
  const refresh = () => {
    avail.refetch();
    bookings.refetch();
  };
  const todayActive = todayOn && date === today();

  const totalHours = avail.data
    ? avail.data.freeHours + avail.data.bookedHours
    : 0;
  const bookedPct =
    totalHours > 0 ? Math.round((avail.data!.bookedHours / totalHours) * 100) : 0;

  return (
    <>
      <PageHeader
        title={isOwner ? "Booking calendar" : "Check availability"}
        subtitle="Pick a day and a studio, then click a free hour to book it."
        actions={
          <Link to={`/bookings/new?date=${date}`} className="btn btn-spot">
            New booking
          </Link>
        }
      />

      {/* Toolbar: date controls on the left, studio on the right */}
      <div className="card mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-line p-1">
            <button
              className="btn btn-ghost !border-0 px-3"
              aria-label="Previous day"
              onClick={() => set({ date: shiftDate(date, -1) })}
            >
              ←
            </button>
            <input
              type="date"
              className="input !w-auto !border-0 !bg-transparent !shadow-none"
              value={date}
              onChange={(e) => e.target.value && set({ date: e.target.value })}
              aria-label="Date"
            />
            <button
              className="btn btn-ghost !border-0 px-3"
              aria-label="Next day"
              onClick={() => set({ date: shiftDate(date, 1) })}
            >
              →
            </button>
          </div>
          <button
            className={`btn rounded-full px-4 ${
              todayActive ? "btn-primary" : "btn-ghost"
            }`}
            aria-pressed={todayActive}
            onClick={() => {
              if (todayActive) {
                setTodayOn(false);
              } else {
                set({ date: today() });
                setTodayOn(true);
              }
            }}
          >
            Today
          </button>
        </div>
        <div className="sm:min-w-[14rem]">
          <StudioSelect
            options={studios.data ?? []}
            value={studioId ?? ""}
            onChange={(id) => set({ studio: id })}
          />
        </div>
      </div>

      <Async
        loading={studios.loading}
        error={studios.error}
        retry={studios.refetch}
      >
        {studios.data?.length === 0 && (
          <Empty
            title="No studios to book"
            hint={
              isOwner
                ? "Add a studio first."
                : "No studios are available right now."
            }
            action={
              isOwner ? (
                <Link to="/studios" className="btn btn-primary">
                  Go to studios
                </Link>
              ) : undefined
            }
          />
        )}
        {studioId && (
          <div
            className={`grid items-start gap-8 ${
              isOwner ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""
            }`}
          >
            {/* Availability */}
            <section className="card !p-0 overflow-hidden">
              <header className="border-b border-line px-6 py-5">
                <h2 className="text-2xl font-bold tracking-tight">
                  {fmtDate(date)}
                </h2>
                {avail.data && (
                  <div className="mt-4">
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-line"
                      role="img"
                      aria-label={`${bookedPct}% of hours booked`}
                    >
                      <div
                        className="h-full rounded-full bg-ink-500 transition-[width] duration-300"
                        style={{ width: `${bookedPct}%` }}
                      />
                    </div>
                    <p className="mt-2 flex gap-4 text-sm text-ink-500">
                      <span>
                        <strong className="font-semibold">
                          {avail.data.freeHours}
                        </strong>{" "}
                        free hours
                      </span>
                      <span>
                        <strong className="font-semibold">
                          {avail.data.bookedHours}
                        </strong>{" "}
                        booked
                      </span>
                    </p>
                  </div>
                )}
              </header>
              <div className="px-6 py-5">
                <Async
                  loading={avail.loading}
                  error={avail.error}
                  retry={avail.refetch}
                >
                  {avail.data && (
                    <SlotGrid
                      slots={avail.data.slots}
                      onPick={(h) =>
                        nav(
                          `/bookings/new?studio=${studioId}&date=${date}&start=${h}`,
                        )
                      }
                    />
                  )}
                </Async>
              </div>
            </section>

            {/* Owner-only: every booking for the day, kept beside the grid on wide screens */}
            {isOwner && (
              <section className="card !p-0 overflow-hidden lg:sticky lg:top-6">
                <header className="flex items-baseline justify-between border-b border-line px-6 py-5">
                  <h2 className="text-xl font-bold tracking-tight">
                    Bookings on {fmtDate(date)}
                  </h2>
                  {bookings.data && bookings.data.length > 0 && (
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-sm text-ink-500">
                      {bookings.data.length}
                    </span>
                  )}
                </header>
                <div className="px-6 py-2">
                  <Async
                    loading={bookings.loading}
                    error={bookings.error}
                    retry={bookings.refetch}
                  >
                    {bookings.data?.length === 0 ? (
                      <Empty
                        title="No bookings this day"
                        hint="Every studio is free. Click an open hour to add one."
                      />
                    ) : (
                      <ul className="divide-y divide-line">
                        {bookings.data?.map((b) => (
                          <BookingItem
                            key={b.id}
                            booking={b}
                            onChanged={refresh}
                          />
                        ))}
                      </ul>
                    )}
                  </Async>
                </div>
              </section>
            )}
          </div>
        )}
      </Async>
    </>
  );
}