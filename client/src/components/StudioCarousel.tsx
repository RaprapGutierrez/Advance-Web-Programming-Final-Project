import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { hourLabel, peso, today } from "../lib/format";
import Thumb from "./Thumb";
import { studioImage } from "../lib/studioImages";
import type { Availability, Studio } from "../types";

const INTERVAL = 5000;

export default function StudioCarousel() {
  const nav = useNavigate();
  const studios = useFetch<Studio[]>("/studios");
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(false);

  const list = studios.data ?? [];
  const count = list.length;
  const idx = count ? i % count : 0;
  const studio = count ? list[idx] : null;
  const date = today();
  const avail = useFetch<Availability>(
    studio ? `/studios/${studio.id}/availability?date=${date}` : null,
  );

  // Auto-advance with a fade: fade out, swap while hidden, fade back in.
  useEffect(() => {
    setFade(false);
    if (count < 2) return;
    const out = setTimeout(() => setFade(true), INTERVAL);
    const swap = setTimeout(() => setI((n) => (n + 1) % count), INTERVAL + 400);
    return () => {
      clearTimeout(out);
      clearTimeout(swap);
    };
  }, [idx, count]);

  const shell = "rounded-xl bg-brand-900 p-5 text-white shadow-card sm:p-7";

  if (studios.loading) {
    return (
      <div className={shell}>
        <p className="text-sm text-white/70">Loading studios…</p>
      </div>
    );
  }

  if (studios.error || !studio) {
    return (
      <div className={shell}>
        <p className="font-display text-lg font-bold">No studios yet</p>
        <p className="mt-1 text-sm text-white/70">
          Studios will show up here once the owner adds them.
        </p>
      </div>
    );
  }

  // Compact tiles: read each slot loosely so this works with your Availability type.
  const slots = (avail.data?.slots ?? []) as unknown as Array<
    Record<string, any>
  >;

  return (
    <div className={shell}>
      <div
        className={`transition-all duration-500 ease-in-out ${
          fade ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <Thumb
          src={studioImage(studio)}
          alt={studio.name}
          badge={studio.type}
          className="mb-3 h-32 w-full rounded-lg sm:h-40"
        />
        <p className="truncate font-display text-lg font-bold">
          {studio.name} · Today
        </p>
        <p className="mt-0.5 text-xs text-white/70">
          {studio.type} · {studio.capacity} pax · {hourLabel(studio.openHour)}{" "}
          to {hourLabel(studio.closeHour)}
        </p>

        <div
          className={`mt-4 grid min-h-[7rem] grid-cols-7 gap-1.5 transition-opacity duration-500 ${
            avail.loading ? "opacity-0" : "opacity-100"
          }`}
        >
          {avail.error && (
            <p className="col-span-7 text-sm text-white/70">
              Couldn't load slots.
            </p>
          )}
          {slots.map((s, n) => {
            const hour: number =
              s.hour ?? s.start ?? s.h ?? studio.openHour + n;
            const booked = Boolean(
              s.booked ?? s.isBooked ?? s.status === "booked",
            );
            const peak = Boolean(s.peak ?? s.isPeak ?? hour >= 17);
            const tone = booked
              ? "bg-brand-500 text-white"
              : peak
                ? "border border-spot-400 text-spot-300 hover:bg-white/10"
                : "border border-white/25 text-white/70 hover:bg-white/10";
            return (
              <button
                key={hour}
                type="button"
                disabled={booked}
                onClick={() =>
                  nav(
                    `/bookings/new?studio=${studio.id}&date=${date}&start=${hour}`,
                  )
                }
                className={`grid h-12 place-items-center rounded-md text-xs font-semibold transition ${tone} ${booked ? "cursor-not-allowed" : ""}`}
              >
                {hour}:00
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/80">
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded bg-brand-500" />
            Booked
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded border border-white/40" />
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-3 w-3 rounded border border-spot-400" />
            Peak rate
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/80">
            Peak {peso(studio.peakRate)} · Off-peak {peso(studio.offPeakRate)} /
            hr
          </p>
          <Link
            to={`/studios/${studio.id}`}
            className="text-xs font-semibold underline underline-offset-4"
          >
            View studio
          </Link>
        </div>
      </div>

      {count > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
          {list.map((s, n) => (
            <span
              key={s.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                n === idx ? "w-6 bg-spot-400" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
