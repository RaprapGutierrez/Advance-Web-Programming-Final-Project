import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errMsg } from "../lib/api";
import { fmtDate, hourLabel, peso } from "../lib/format";
import { ConfirmDialog, StatusBadge } from "./ui";
import { useToast } from "./Toast";
import type { Booking, Status } from "../types";

const NEXT: Record<Status, { to: Status; label: string }[]> = {
  pending: [{ to: "confirmed", label: "Confirm" }],
  confirmed: [{ to: "paid", label: "Mark paid" }],
  paid: [{ to: "completed", label: "Complete" }],
  completed: [],
  cancelled: [],
};

export default function BookingItem({
  booking: b,
  onChanged,
  showDate,
}: {
  booking: Booking;
  onChanged?: () => void;
  showDate?: boolean;
}) {
  const toast = useToast();
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const canEdit = b.status === "pending" || b.status === "confirmed";
  const canCancel = b.status === "pending" || b.status === "confirmed";

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setConfirm(null);
      onChanged?.();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="my-3 list-none rounded-xl border border-line bg-white p-4 transition hover:shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold">{b.studioName}</p>
            <StatusBadge status={b.status} />
            {b.overdue && (
              <span className="badge bg-alert-600 text-white">
                Payment overdue
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            {showDate && `${fmtDate(b.date)} · `}
            {hourLabel(b.startHour)}–{hourLabel(b.endHour)} · {b.renterName} ·{" "}
            {b.guests} guests
          </p>
          {b.equipmentNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {b.equipmentNames.map((n, i) => (
                <span
                  key={i}
                  className="rounded-full bg-line px-2.5 py-0.5 text-xs font-medium text-ink-500"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="font-display text-2xl font-extrabold">
            {peso(b.total)}
          </p>
          <p
            className={`text-sm ${b.balanceDue > 0 ? "text-alert-600" : "text-ok-600"}`}
          >
            {b.balanceDue > 0 ? `${peso(b.balanceDue)} due` : "Fully paid"}
          </p>
        </div>
      </div>
      {onChanged && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
          {NEXT[b.status].map((n) => (
            <button
              key={n.to}
              className="btn btn-primary px-3 py-2"
              disabled={busy}
              onClick={() =>
                run(
                  () => api.patch(`/bookings/${b.id}/status`, { status: n.to }),
                  `Booking ${n.to}`,
                )
              }
            >
              {n.label}
            </button>
          ))}
          {canEdit && (
            <Link
              to={`/bookings/${b.id}/edit`}
              className="btn btn-ghost px-3 py-2"
            >
              Edit
            </Link>
          )}
          {canCancel && (
            <button
              className="btn btn-ghost px-3 py-2"
              onClick={() => setConfirm("cancel")}
            >
              Cancel booking
            </button>
          )}
          <button
            className="btn btn-ghost px-3 py-2 text-alert-600"
            onClick={() => setConfirm("delete")}
          >
            Delete
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm === "cancel"}
        busy={busy}
        title="Cancel this booking?"
        message="The time slot becomes free for other renters."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={() =>
          run(
            () =>
              api.patch(`/bookings/${b.id}/status`, { status: "cancelled" }),
            "Booking cancelled",
          )
        }
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        busy={busy}
        title="Delete this booking?"
        message="Its recorded payments are removed too. This can't be undone."
        onConfirm={() =>
          run(() => api.delete(`/bookings/${b.id}`), "Booking deleted")
        }
        onCancel={() => setConfirm(null)}
      />
    </li>
  );
}
