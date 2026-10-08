import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { api, errMsg } from "../lib/api";
import { Async, ConfirmDialog, Empty, PageHeader } from "../components/ui";
import { RenterModal } from "../components/forms";
import { useToast } from "../components/Toast";
import { peso } from "../lib/format";
import type { Renter } from "../types";

const tierCls = {
  Standard: "bg-brand-50 text-brand-700",
  Silver: "bg-ink-300/40 text-ink-900",
  Gold: "bg-spot-300 text-ink-900",
};

type RenterBooking = {
  id: string;
  renterId: string;
  studioName?: string;
  date?: string;
  total?: number;
  status?: string;
};

export default function Renters() {
  const { data, loading, error, refetch } = useFetch<Renter[]>("/renters");
  const bookings = useFetch<RenterBooking[]>("/bookings");
  const [modal, setModal] = useState<Renter | "new" | null>(null);
  const [del, setDel] = useState<Renter | null>(null);
  const [history, setHistory] = useState<Renter | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const historyList = (bookings.data ?? []).filter(
    (b) => b.renterId === history?.id,
  );

  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await api.delete("/renters/" + del.id);
      toast("Deleted " + del.name);
      setDel(null);
      refetch();
    } catch (e) {
      toast(errMsg(e), "error");
      setDel(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Renters"
        subtitle="Loyalty tiers update as bookings are completed."
        actions={
          <button className="btn btn-spot" onClick={() => setModal("new")}>
            Add renter
          </button>
        }
      />
      <Async loading={loading} error={error} retry={refetch}>
        {data && data.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Renters", data.length],
              ["Gold", data.filter((r) => r.tier === "Gold").length],
              ["With balance", data.filter((r) => r.balanceDue > 0).length],
              ["Total due", peso(data.reduce((n, r) => n + r.balanceDue, 0))],
            ].map(([label, value]) => (
              <div key={label} className="card !p-4">
                <p className="text-sm text-ink-500">{label}</p>
                <p className="mt-1 text-2xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>
        )}

        {data?.length === 0 && (
          <Empty
            title="No renters yet"
            hint="Add the people and groups who rent your rooms."
            action={
              <button
                className="btn btn-primary"
                onClick={() => setModal("new")}
              >
                Add renter
              </button>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <article
                key={r.id}
                className="card flex flex-col transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 font-bold text-brand-700">
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                    <h2 className="break-words text-lg font-bold">{r.name}</h2>
                  </div>
                  <span className={"badge " + tierCls[r.tier]}>
                    {r.tier}
                    {r.discountRate > 0 &&
                      " · " + Math.round(r.discountRate * 100) + "% off"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-ink-500">{r.email}</p>
                <p className="text-sm text-ink-500">{r.phone}</p>
                <p className="mt-3 text-sm">
                  {r.completedBookings} completed · {r.bookings} total bookings
                </p>
                <p
                  className={
                    "font-display text-xl font-bold " +
                    (r.balanceDue > 0 ? "text-alert-600" : "text-ok-600")
                  }
                >
                  {r.balanceDue > 0 ? peso(r.balanceDue) + " due" : "Nothing due"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button
                    className="btn btn-primary"
                    onClick={() => setHistory(r)}
                  >
                    History
                  </button>
                  <button className="btn btn-ghost" onClick={() => setModal(r)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost text-alert-600"
                    onClick={() => setDel(r)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Async>

      {history && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setHistory(null)}
        >
          <div
            className="card relative max-h-[85vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setHistory(null)}
              className="absolute right-3 top-3 text-2xl leading-none text-ink-500"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold">{history.name}</h3>
            <p className="text-sm text-ink-500">
              Booking history · {historyList.length} booking
              {historyList.length === 1 ? "" : "s"} ·{" "}
              {peso(historyList.reduce((n, b) => n + (b.total ?? 0), 0))} total
            </p>
            {bookings.loading ? (
              <p className="mt-4 text-ink-500">Loading...</p>
            ) : historyList.length === 0 ? (
              <p className="mt-4 text-ink-500">No bookings yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {historyList.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold">{b.studioName ?? "Studio"}</p>
                      <p className="text-sm text-ink-500">
                        {b.date ? new Date(b.date).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{peso(b.total ?? 0)}</p>
                      <p className="text-xs capitalize text-ink-500">
                        {b.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {modal && (
        <RenterModal
          renter={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={refetch}
        />
      )}
      <ConfirmDialog
        open={!!del}
        busy={busy}
        title={"Delete " + (del?.name ?? "") + "?"}
        message="Renters with bookings can't be deleted."
        onConfirm={remove}
        onCancel={() => setDel(null)}
      />
    </>
  );
}