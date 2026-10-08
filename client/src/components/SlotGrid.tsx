import { hourLabel, peso } from '../lib/format';
import type { Slot } from '../types';

// One cell per hour. Free cells can be picked; booked cells show who has them.
export default function SlotGrid({ slots, onPick }: { slots: Slot[]; onPick?: (hour: number) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {slots.map((s) => (
        <li key={s.hour}>
          {s.booked ? (
            <div className="rounded-lg border border-brand-100 bg-[repeating-linear-gradient(135deg,#eeebff,#eeebff_6px,#e3deff_6px,#e3deff_12px)] p-3 text-sm">
              <p className="font-bold text-brand-700">{hourLabel(s.hour)}</p>
              <p className="truncate text-xs text-brand-700">{s.renterName ?? 'Booked'}</p>
            </div>
          ) : (
            <button type="button" disabled={!onPick} onClick={() => onPick?.(s.hour)}
              className={`w-full rounded-lg border bg-white p-3 text-left text-sm transition ${s.peak ? 'border-spot-400' : 'border-line'} ${onPick ? 'hover:bg-brand-50' : 'cursor-default'}`}>
              <p className="font-bold">{hourLabel(s.hour)}</p>
              <p className="text-xs text-ink-500">{peso(s.rate)}{s.peak ? ' · peak' : ''}</p>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
