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

function Stars({ value }: { value: number }) {
  return (
    <span className="text-spot-400" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(value)}
      <span className="text-line">{"★".repeat(5 - value)}</span>
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
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">What renters say</h2>
          <p className="mt-1 text-ink-500">
            <Stars value={Math.round(avg)} /> {avg.toFixed(1)} average from{" "}
            {reviews.length} reviews
          </p>
        </div>
        <div className="flex gap-1" role="tablist">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === key
                  ? "bg-brand-900 text-white"
                  : "text-ink-500 hover:bg-brand-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {shown.map((r) => (
          <article key={r.id} className="card flex flex-col">
            <div className="flex items-center gap-3">
              <Thumb
                src={r.image}
                alt={r.name}
                className="h-12 w-12 rounded-lg"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.name}</p>
                <p className="text-xs capitalize text-ink-500">{r.kind}</p>
              </div>
            </div>
            <p className="mt-3 text-sm">
              <Stars value={r.rating} />
            </p>
            <p className="mt-2 flex-1 text-sm text-ink-500">“{r.text}”</p>
            <p className="mt-3 text-xs text-ink-500">
              {r.author} · {r.when}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
