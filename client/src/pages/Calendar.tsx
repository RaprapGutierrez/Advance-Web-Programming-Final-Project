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
      <div className="card mb-6 flex flex-wrap items-center gap-3">
        <button
          className="btn btn-ghost px-3"
          aria-label="Previous day"
          onClick={() => set({ date: shiftDate(date, -1) })}
        >
          ←
        </button>
        <input
          type="date"
          className="input !w-auto"
          value={date}
          onChange={(e) => e.target.value && set({ date: e.target.value })}
          aria-label="Date"
        />
        <button
          className="btn btn-ghost px-3"
          aria-label="Next day"
          onClick={() => set({ date: shiftDate(date, 1) })}
        >
          →
        </button>
        <button
          className={`btn ${todayActive ? "btn-primary" : "btn-ghost"}`}
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
        <StudioSelect
          options={studios.data ?? []}
          value={studioId ?? ""}
          onChange={(id) => set({ studio: id })}
        />
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
          <div className="space-y-6">
            <section className="card">
              <h2 className="mb-1 text-xl font-bold">{fmtDate(date)}</h2>
              {avail.data && (
                <p className="mb-4 text-sm text-ink-500">
                  {avail.data.freeHours} free hours · {avail.data.bookedHours}{" "}
                  booked
                </p>
              )}
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
            </section>
            {isOwner && (
              <section className="card">
                <h2 className="text-xl font-bold">
                  All bookings on {fmtDate(date)}
                </h2>
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
                    <ul className="mt-1 divide-y divide-line">
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
              </section>
            )}
          </div>
        )}
      </Async>
    </>
  );
}
