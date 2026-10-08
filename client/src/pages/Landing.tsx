import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import StudioCarousel from "../components/StudioCarousel";
import FeedbackSection from "../components/FeedbackSection";
import Thumb from "../components/Thumb";
import { equipmentImage } from "../lib/equipmentImages";
import { useFetch } from "../hooks/useFetch";
import { peso } from "../lib/format";
import type { Equipment } from "../types";

// A sample day on the calendar: b = booked, p = open at peak rate, o = open off-peak
const day = "bbooopppbbbppp".split("");
const features = [
  [
    "No double-bookings",
    "Every request is checked against the room and its gear before it is saved.",
  ],
  [
    "Prices that add themselves up",
    "Peak and off-peak hours, add-ons and loyalty discounts are worked out for you.",
  ],
  [
    "See who still owes",
    "Partial payments, balances and overdue bookings are flagged in one place.",
  ],
];

export default function Landing() {
  const gear = useFetch<Equipment[]>("/equipment");
  const items = gear.data?.slice(0, 8) ?? [];
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Equipment | null>(null);
  const rent = (g: Equipment) => {
    const target = `/bookings/new?equipment=${g.id}`;
    if (!user) {
      // not logged in: go to login, then come back to booking
      navigate("/login", { state: { from: target } });
    } else {
      navigate(target);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
            Studio rentals, made simple
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Book the room. Skip the back-and-forth.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-500">
            StudioSpace runs rentals for music rooms, photo studios, dance halls
            and podcast booths: open hours, rates, add-ons and payments.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/calendar" className="btn btn-spot px-6 py-3 text-base">
              Open the calendar
            </Link>
            <Link to="/studios" className="btn btn-ghost px-6 py-3 text-base">
              Browse studios
            </Link>
          </div>
        </div>
        <StudioCarousel />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(([t, b]) => (
          <div
            key={t}
            className="card border-t-4 border-t-brand-500 transition hover:-translate-y-1 hover:shadow-card"
          >
            <h2 className="text-xl font-bold">{t}</h2>
            <p className="mt-2 text-ink-500">{b}</p>
          </div>
        ))}
      </section>
      {items.length > 0 && (
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Gear you can add
              </h2>
              <p className="mt-1 text-ink-500">
                Mics, lights and more, available with any booking.
              </p>
            </div>
            <Link to="/studios" className="btn btn-ghost">
              See all add-ons
            </Link>
          </div>
          <div className="marquee-track">
            {[...items, ...items].map((g, i) => (
              <article
                key={g.id + "-" + i}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(g)}
                onKeyDown={(e) => e.key === "Enter" && setSelected(g)}
                className="group card cursor-pointer overflow-hidden !p-0 transition hover:-translate-y-1 hover:shadow-card"
              >
                <Thumb
                  src={equipmentImage(g)}
                  alt={g.name}
                  className="aspect-[4/3] w-full rounded-none transition duration-300 group-hover:scale-105"
                />
                <p className="px-4 pt-4 truncate text-lg font-bold">{g.name}</p>
                <p className="px-4 pb-4 text-sm font-semibold text-brand-700">
                  {peso(g.fee)} per booking
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="card relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 text-2xl leading-none text-ink-500"
              aria-label="Close"
            >
              ×
            </button>
            <Thumb
              src={equipmentImage(selected)}
              alt={selected.name}
              className="aspect-video w-full rounded-lg"
            />
            <h3 className="mt-4 text-3xl font-extrabold">{selected.name}</h3>
            <p className="mt-1 text-ink-500">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                  {peso(selected.fee)} per booking
                </span>
              </span>
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => rent(selected)}
                className="btn btn-spot flex-1 py-3"
              >
                Rent
              </button>
              <button
                onClick={() => setSelected(null)}
                className="btn btn-ghost py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <FeedbackSection />
    </div>
  );
}
