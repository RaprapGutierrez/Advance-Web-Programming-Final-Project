import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import Thumb from "./Thumb";
import { studioImage } from "../lib/studioImages";
import { equipmentImage } from "../lib/equipmentImages";
import type { Equipment, Studio } from "../types";

type Kind = "studio" | "equipment";
type Review = {
  id: string;
  kind: Kind;
  name: string;
  image?: string;
  rating: number;
  text: string;
  author: string;
  when: string;
};

// SAMPLE DATA for UI testing. Replace with real feedback from the API later.
const studioSamples = [
  {
    author: "Maria S.",
    rating: 5,
    when: "2 days ago",
    text: "Clean, quiet and exactly as pictured. Booking was quick and the staff were helpful.",
  },
  {
    author: "Joel R.",
    rating: 4,
    when: "1 week ago",
    text: "Great space for our session. Peak hours are pricey but the room is worth it.",
  },
  {
    author: "Anna D.",
    rating: 5,
    when: "2 weeks ago",
    text: "Plenty of room for the whole group. We'll definitely book again.",
  },
];
const gearSamples = [
  {
    author: "Paolo M.",
    rating: 5,
    when: "3 days ago",
    text: "Worked perfectly and was set up before we arrived.",
  },
  {
    author: "Kim L.",
    rating: 4,
    when: "1 week ago",
    text: "Good quality for the price. Easy to add to the booking.",
  },
  {
    author: "Rico T.",
    rating: 5,
    when: "3 weeks ago",
    text: "Saved us from bringing our own gear. Highly recommended.",
  },
];

function Stars({
  value,
  empty = "text-line",
}: {
  value: number;
  empty?: string;
}) {
  return (
    <span className="text-spot-400" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(value)}
      <span className={empty}>{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function FeedbackSection() {
  const studios = useFetch<Studio[]>("/studios");
  const gear = useFetch<Equipment[]>("/equipment");
  const [tab, setTab] = useState<"all" | Kind>("all");

  const reviews = useMemo<Review[]>(() => {
    const out: Review[] = [];
    (studios.data ?? []).forEach((s, i) => {
      const a = studioSamples[i % studioSamples.length];
      out.push({
        id: `s-${s.id}`,
        kind: "studio",
        name: s.name,
        image: studioImage(s),
        ...a,
      });
    });
    (gear.data ?? []).forEach((g, i) => {
      const a = gearSamples[i % gearSamples.length];
      out.push({
        id: `g-${g.id}`,
        kind: "equipment",
        name: g.name,
        image: equipmentImage(g),
        ...a,
      });
    });
    return out;
  }, [studios.data, gear.data]);

  const shown = reviews
    .filter((r) => tab === "all" || r.kind === tab)
    .slice(0, 6);
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const tabs: ["all" | Kind, string][] = [
    ["all", "All"],
    ["studio", "Studios"],
    ["equipment", "Equipment"],
  ];

  return (
    <section className="rounded-3xl bg-brand-900 p-6 shadow-card sm:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="text-2xl font-bold text-white sm:text-4xl">
            What renters say
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-5xl font-extrabold leading-none text-spot-400">
              {avg.toFixed(1)}
            </span>
            <div>
              <p className="text-lg leading-none">
                <Stars value={Math.round(avg)} empty="text-white/25" />
              </p>
              <p className="mt-1 text-sm text-white/70">
                from {reviews.length} reviews
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-spot-400 ${
                tab === key
                  ? "bg-spot-400 text-brand-900 shadow-md"
                  : "border border-white/25 text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {shown.map((r) => (
          <article
            key={r.id}
            className="card relative flex flex-col overflow-hidden border-0 pt-7 transition duration-200 hover:-translate-y-1.5 hover:shadow-xl"
          >
            {/* colored accent bar */}
            <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-alert-600 to-spot-400" />
            {/* big quote mark */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-3 font-display text-7xl font-extrabold leading-none text-brand-100"
            >
              “
            </span>

            <div className="relative flex items-center gap-3">
              <Thumb
                src={r.image}
                alt={r.name}
                className="h-12 w-12 rounded-xl"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-900">{r.name}</p>
                <span
                  className={`badge mt-0.5 capitalize ${
                    r.kind === "studio"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-alert-100 text-alert-700"
                  }`}
                >
                  {r.kind}
                </span>
              </div>
            </div>

            <p className="mt-4 text-base">
              <Stars value={r.rating} />
            </p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
              {r.text}
            </p>

            <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {r.author.charAt(0)}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink-900">{r.author}</p>
                <p className="text-xs text-ink-300">{r.when}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
