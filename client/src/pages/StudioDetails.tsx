import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { Async, Empty, PageHeader } from "../components/ui";
import BookingItem from "../components/BookingItem";
import SlotGrid from "../components/SlotGrid";
import { hourLabel, peso, today } from "../lib/format";
import { useAuth } from "../lib/auth";
import Thumb from "../components/Thumb";
import { studioImage } from "../lib/studioImages";
import type { Availability, Booking, Studio } from "../types";

export default function StudioDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const isOwner = useAuth().hasRole("owner");
  const [date, setDate] = useState(today());
  const studio = useFetch<Studio>(`/studios/${id}`);
  const avail = useFetch<Availability>(
    `/studios/${id}/availability?date=${date}`,
  );
  const upcoming = useFetch<Booking[]>(`/bookings?studioId=${id}`);
  const s = studio.data;
  const next =
    upcoming.data
      ?.filter((b) => b.date >= today() && b.status !== "cancelled")
      .slice(0, 5) ?? [];
  return (
    <Async loading={studio.loading} error={studio.error} retry={studio.refetch}>
      {s && (
        <>
          <PageHeader
            title={s.name}
            subtitle={`${s.type} studio · ${s.capacity} pax · open ${hourLabel(s.openHour)} to ${hourLabel(s.closeHour)}`}
            actions={
              <>
                <Link
                  to={`/bookings/new?studio=${s.id}&date=${date}`}
                  className="btn btn-spot"
                >
                  Book this studio
                </Link>
                <Link to="/studios" className="btn btn-ghost">
                  All studios
                </Link>
              </>
            }
          />
          <Thumb
            src={studioImage(s)}
            alt={s.name}
            badge={s.type}
            className="mb-4 aspect-video max-h-80 w-full rounded-xl"
          />
          {(s.images?.length ?? 0) > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {s.images!.slice(1).map((src, i) => (
                <Thumb
                  key={i}
                  src={src}
                  alt={`${s.name} ${i + 2}`}
                  className="h-20 w-32 rounded-lg"
                />
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card !p-4">
              <p className="text-sm text-ink-500">Peak (from 17:00)</p>
              <p className="font-display text-2xl font-extrabold">
                {peso(s.peakRate)}
                <span className="text-sm font-medium text-ink-500"> / hr</span>
              </p>
            </div>
            <div className="card !p-4">
              <p className="text-sm text-ink-500">Off-peak</p>
              <p className="font-display text-2xl font-extrabold">
                {peso(s.offPeakRate)}
                <span className="text-sm font-medium text-ink-500"> / hr</span>
              </p>
            </div>
            <div className="card !p-4">
              <p className="text-sm text-ink-500">About</p>
              <p className="text-sm">{s.description || "No description"}</p>
            </div>
          </div>
          <section className="card mt-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Availability</h2>
                {avail.data && (
                  <p className="text-sm text-ink-500">
                    {avail.data.freeHours} free · {avail.data.bookedHours}{" "}
                    booked
                  </p>
                )}
              </div>
              <input
                type="date"
                className="input !w-auto"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                aria-label="Date"
              />
            </div>
            <Async
              loading={avail.loading}
              error={avail.error}
              retry={avail.refetch}
            >
              {avail.data && (
                <SlotGrid
                  slots={avail.data.slots}
                  onPick={(h) =>
                    nav(`/bookings/new?studio=${s.id}&date=${date}&start=${h}`)
                  }
                />
              )}
            </Async>
          </section>
          {isOwner && (
            <section className="card mt-6">
              <h2 className="text-xl font-bold">Upcoming bookings</h2>
              <Async
                loading={upcoming.loading}
                error={upcoming.error}
                retry={upcoming.refetch}
              >
                {next.length === 0 ? (
                  <Empty
                    title="No upcoming bookings"
                    hint="Pick a free hour above to create one."
                  />
                ) : (
                  <ul className="mt-1 divide-y divide-line">
                    {next.map((b) => (
                      <BookingItem key={b.id} booking={b} showDate />
                    ))}
                  </ul>
                )}
              </Async>
            </section>
          )}
        </>
      )}
    </Async>
  );
}
