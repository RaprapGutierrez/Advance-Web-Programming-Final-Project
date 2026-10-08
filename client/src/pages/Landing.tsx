import { Link } from "react-router-dom";
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
  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
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
          <div key={t} className="card">
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((g) => (
              <article key={g.id} className="card !p-3">
                <Thumb
                  src={equipmentImage(g)}
                  alt={g.name}
                  className="aspect-square w-full rounded-lg"
                />
                <p className="mt-3 truncate font-semibold">{g.name}</p>
                <p className="text-sm text-ink-500">
                  {peso(g.fee)} per booking
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
      <FeedbackSection />
    </div>
  );
}
