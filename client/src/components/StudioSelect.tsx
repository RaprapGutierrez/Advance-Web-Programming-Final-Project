import { useEffect, useRef, useState } from "react";

type Option = { id: string; name: string };

export default function StudioSelect({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative sm:ml-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Studio"
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[12rem] items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-900/30"
      >
        <span className="truncate">{current?.name ?? "Select studio"}</span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 max-h-64 w-full min-w-[12rem] overflow-auto rounded-xl border border-line bg-white p-1 shadow-lg"
        >
          {options.map((o) => {
            const active = o.id === value;
            return (
              <li key={o.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-brand-900 text-white"
                      : "text-ink-500 hover:bg-brand-50"
                  }`}
                >
                  <span className="truncate">{o.name}</span>
                  {active && <span aria-hidden>✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
