import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api, errMsg } from "../lib/api";
import { Async, ConfirmDialog, Empty, PageHeader } from "../components/ui";
import { EquipmentModal, StudioModal } from "../components/forms";
import { useToast } from "../components/Toast";
import { hourLabel, peso } from "../lib/format";
import type { Equipment, Renter, Studio } from "../types";
import { useAuth } from "../lib/auth";
import Thumb from "../components/Thumb";
import { studioImage } from "../lib/studioImages";
import { equipmentImage, equipmentType } from "../lib/equipmentImages";
import StudioCarousel from "../components/StudioCarousel";

type MyBooking = {
  id: string;
  renterId?: string;
  studioId?: string;
  guests?: number;
  equipmentIds?: string[];
  studioName?: string;
  date?: string;
  startHour?: number;
  endHour?: number;
  total?: number;
  status?: string;
};

export default function Studios() {
  const studios = useFetch<Studio[]>("/studios");
  const gear = useFetch<Equipment[]>("/equipment");
  const [studioModal, setStudioModal] = useState<Studio | "new" | null>(null);
  const [gearModal, setGearModal] = useState<Equipment | "new" | null>(null);
  const [del, setDel] = useState<{
    kind: "studios" | "equipment";
    id: string;
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const isOwner = useAuth().hasRole("owner");
  const [rented, setRented] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const myBookings = useFetch<MyBooking[]>(
    !isOwner && showHistory ? "/bookings" : null,
  );
  const renters = useFetch<Renter[]>(
    !isOwner && showHistory ? "/renters" : null,
  );
  const { user } = useAuth();
  const me = renters.data?.find(
    (r) =>
      r.name.trim().toLowerCase() === (user?.name ?? "").trim().toLowerCase(),
  );
  const [selected, setSelected] = useState<MyBooking | null>(null);
  const sent = useFetch<{ bookingId: string }[]>(
    !isOwner && showHistory ? "/feedback" : null,
  );
  const [fbFor, setFbFor] = useState<MyBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  async function sendFeedback() {
    if (!fbFor) return;
    setSending(true);
    try {
      await api.post("/feedback", { bookingId: fbFor.id, rating, comment });
      toast("Thanks for your feedback!");
      setFbFor(null);
      setRating(5);
      setComment("");
      sent.refetch();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setSending(false);
    }
  }
  const myList = (myBookings.data ?? [])
    .filter((b) => !!me && b.renterId === me.id)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const toggleRent = (id: string) =>
    setRented((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await api.delete(`/${del.kind}/${del.id}`);
      toast(`Deleted ${del.name}`);
      setDel(null);
      studios.refetch();
      gear.refetch();
    } catch (e) {
      toast(errMsg(e), "error");
      setDel(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!isOwner && (
        <section className="mb-12 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Find your room. Pick your time. Make something.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-500">
              Browse our music rooms, photo studios, dance halls and podcast
              booths, compare peak and off-peak rates, and add the gear you need
              before you book.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/bookings/new"
                className="btn btn-spot px-6 py-3 text-base"
              >
                Book a session
              </Link>
              <Link
                to="/calendar"
                className="btn btn-ghost px-6 py-3 text-base"
              >
                Check availability
              </Link>
            </div>
          </div>
          <StudioCarousel />
        </section>
      )}
      <PageHeader
        title="Studios"
        subtitle={
          isOwner
            ? "Rooms you rent out, with their rates and hours."
            : "Pick a room and book your session."
        }
        actions={
          isOwner ? (
            <button
              className="btn btn-spot"
              onClick={() => setStudioModal("new")}
            >
              Add studio
            </button>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={() => setShowHistory(true)}
            >
              History
            </button>
          )
        }
      />
      <Async
        loading={studios.loading || gear.loading}
        error={studios.error ?? gear.error}
        retry={() => {
          studios.refetch();
          gear.refetch();
        }}
      >
        {studios.data && gear.data && (
          <div className="space-y-10">
            {isOwner && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ["Studios", studios.data.length],
                  ["Add-ons", gear.data.length],
                  [
                    "Total capacity",
                    studios.data.reduce((n, s) => n + s.capacity, 0) + "pax",
                  ],
                  [
                    "Out of stock",
                    gear.data.filter((g) => g.quantity < 1).length,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="card !p-4">
                    <p className="text-sm text-ink-500">{label}</p>
                    <p className="mt-1 text-3xl font-extrabold">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {studios.data.length === 0 ? (
              <Empty
                title="No studios yet"
                hint={
                  isOwner
                    ? "Add your first room to start taking bookings."
                    : "No studios are available right now. Please check back soon."
                }
                action={
                  isOwner ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setStudioModal("new")}
                    >
                      Add studio
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {studios.data.map((s) => (
                  <article key={s.id} className="card flex flex-col">
                    <Thumb
                      src={studioImage(s)}
                      alt={s.name}
                      badge={s.type}
                      className="mb-4 aspect-video w-full rounded-lg"
                    />
                    <h2 className="break-words text-xl font-bold">{s.name}</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      {s.description || "No description"}
                    </p>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt className="text-ink-500">Peak</dt>
                        <dd className="font-bold">{peso(s.peakRate)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500">Off-peak</dt>
                        <dd className="font-bold">{peso(s.offPeakRate)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-500">Capacity</dt>
                        <dd className="font-bold">{s.capacity} pax</dd>
                      </div>
                    </dl>
                    <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-line px-3 py-1 text-sm font-medium text-ink-500">
                      <span className="h-2 w-2 rounded-full bg-ok-600" />
                      Open {hourLabel(s.openHour)} to {hourLabel(s.closeHour)}
                    </p>{" "}
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                      <Link to={`/studios/${s.id}`} className="btn btn-primary">
                        View
                      </Link>
                      {!isOwner && (
                        <Link
                          to={`/bookings/new?studio=${s.id}`}
                          className="btn btn-spot"
                        >
                          Book now
                        </Link>
                      )}
                      {isOwner && (
                        <button
                          className="btn btn-ghost"
                          onClick={() => setStudioModal(s)}
                        >
                          Edit
                        </button>
                      )}
                      {isOwner && (
                        <button
                          className="btn btn-ghost text-alert-600"
                          onClick={() =>
                            setDel({ kind: "studios", id: s.id, name: s.name })
                          }
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">Add-ons and equipment</h2>
                {isOwner && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setGearModal("new")}
                  >
                    Add add-on
                  </button>
                )}
              </div>
              {gear.data.length === 0 ? (
                <Empty
                  title="No add-ons"
                  hint={
                    isOwner
                      ? "Add mics, lights or other gear renters can include."
                      : "No extra gear is offered right now."
                  }
                />
              ) : (
                <ul className="card divide-y divide-line !py-2">
                  {gear.data.map((g) => (
                    <li
                      key={g.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <Thumb
                        src={equipmentImage(g)}
                        alt={g.name}
                        className="h-14 w-14 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {g.name}
                          <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs font-medium text-ink-500">
                            {equipmentType(g)}
                          </span>
                          {isOwner && g.quantity < 1 && (
                            <span className="ml-2 rounded-full bg-alert-600/15 px-2 py-0.5 text-xs font-medium text-alert-600">
                              Out of stock
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-ink-500">
                          {peso(g.fee)} per booking · {g.quantity}{" "}
                          {g.quantity === 1 ? "unit" : "units"}
                        </p>
                        {(g.images?.length ?? 0) > 1 && (
                          <p className="text-xs text-ink-500">
                            {g.images!.length} photos
                          </p>
                        )}
                      </div>
                      {isOwner && (
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost px-3 py-2"
                            onClick={() => setGearModal(g)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost px-3 py-2 text-alert-600"
                            onClick={() =>
                              setDel({
                                kind: "equipment",
                                id: g.id,
                                name: g.name,
                              })
                            }
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {!isOwner && (
                        <button
                          className={`btn px-3 py-2 ${rented.includes(g.id) ? "btn-primary" : "btn-ghost"}`}
                          aria-pressed={rented.includes(g.id)}
                          disabled={g.quantity < 1}
                          onClick={() => toggleRent(g.id)}
                        >
                          {g.quantity < 1
                            ? "Out of stock"
                            : rented.includes(g.id)
                              ? "Added ✓"
                              : "Rent"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!isOwner && rented.length > 0 && (
                <div className="card mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-bold">{rented.length}</span> add-on
                    {rented.length === 1 ? "" : "s"} selected ·{" "}
                    <span className="font-bold">
                      {peso(
                        gear.data
                          .filter((g) => rented.includes(g.id))
                          .reduce((sum, g) => sum + g.fee, 0),
                      )}
                    </span>{" "}
                    per booking
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost"
                      onClick={() => setRented([])}
                    >
                      Clear
                    </button>
                    <Link
                      to={`/bookings/new?gear=${rented.join(",")}`}
                      className="btn btn-spot"
                    >
                      Continue to booking
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </Async>
      {showHistory && !isOwner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowHistory(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="My booking history"
            className="card relative max-h-[85vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHistory(false)}
              className="absolute right-3 top-3 text-2xl leading-none text-ink-500"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold">My booking history</h3>
            <p className="text-sm text-ink-500">
              {myList.length} booking{myList.length === 1 ? "" : "s"} ·{" "}
              {peso(myList.reduce((n, b) => n + (b.total ?? 0), 0))} total
            </p>
            {myBookings.loading || renters.loading ? (
              <p className="mt-4 text-ink-500">Loading...</p>
            ) : myBookings.error ? (
              <p className="mt-4 text-alert-600">
                Couldn't load your history.{" "}
                <button className="underline" onClick={myBookings.refetch}>
                  Try again
                </button>
              </p>
            ) : myList.length === 0 ? (
              <div className="mt-4">
                <p className="text-ink-500">No bookings yet.</p>
                <Link to="/bookings/new" className="btn btn-spot mt-3">
                  Book a session
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {myList.map((b) => (
                  <li
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(b)}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(b)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-line active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {b.studioName ?? "Studio"}
                      </p>
                      <p className="text-sm text-ink-500">
                        {b.date
                          ? new Date(b.date).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                        {b.startHour != null && b.endHour != null
                          ? ` · ${hourLabel(b.startHour)} to ${hourLabel(b.endHour)}`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{peso(b.total ?? 0)}</p>
                      <p className="mt-0.5 inline-block rounded-full bg-line px-2 py-0.5 text-xs font-medium capitalize text-ink-500">
                        {b.status}
                      </p>
                      {b.status === "completed" &&
                        (sent.data?.some((f) => f.bookingId === b.id) ? (
                          <p className="mt-1 text-xs font-semibold text-ok-600">
                            Feedback sent ✓
                          </p>
                        ) : (
                          <button
                            className="btn btn-spot mt-1 px-3 py-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFbFor(b);
                            }}
                          >
                            Feedback
                          </button>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <style>{`@keyframes popIn{from{opacity:0;transform:scale(.92) translateY(8px)}to{opacity:1;transform:none}}`}</style>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Booking details"
            className="card relative w-full max-w-sm"
            style={{ animation: "popIn .2s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 text-2xl leading-none text-ink-500"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold">
              {selected.studioName ?? "Studio"}
            </h3>
            <p className="mt-1 inline-block rounded-full bg-line px-2 py-0.5 text-xs font-medium capitalize text-ink-500">
              {selected.status}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Date</dt>
                <dd className="font-semibold">
                  {selected.date
                    ? new Date(selected.date).toLocaleDateString("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Time</dt>
                <dd className="font-semibold">
                  {selected.startHour != null && selected.endHour != null
                    ? `${hourLabel(selected.startHour)} to ${hourLabel(selected.endHour)}`
                    : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Guests</dt>
                <dd className="font-semibold">{selected.guests ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Add-ons</dt>
                <dd className="text-right font-semibold">
                  {selected.equipmentIds?.length
                    ? selected.equipmentIds
                        .map(
                          (id) =>
                            gear.data?.find((g) => g.id === id)?.name ?? "Item",
                        )
                        .join(", ")
                    : "None"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold">
                <dt>Total</dt>
                <dd>{peso(selected.total ?? 0)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
      {fbFor && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setFbFor(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave feedback"
            className="card relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFbFor(null)}
              className="absolute right-3 top-3 text-2xl leading-none text-ink-500"
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-xl font-bold">How was your session?</h3>
            <p className="text-sm text-ink-500">
              {fbFor.studioName ?? "Studio"}
            </p>
            <div
              className="mt-4 flex gap-1 text-3xl"
              role="radiogroup"
              aria-label="Rating"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className={n <= rating ? "text-spot-400" : "text-line"}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="input mt-4 h-24 w-full"
              maxLength={500}
              placeholder="Tell us about your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button
                className="btn btn-spot flex-1"
                disabled={sending}
                onClick={sendFeedback}
              >
                {sending ? "Sending…" : "Send feedback"}
              </button>
              <button className="btn btn-ghost" onClick={() => setFbFor(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {studioModal && (
        <StudioModal
          studio={studioModal === "new" ? undefined : studioModal}
          onClose={() => setStudioModal(null)}
          onSaved={studios.refetch}
        />
      )}
      {gearModal && (
        <EquipmentModal
          item={gearModal === "new" ? undefined : gearModal}
          onClose={() => setGearModal(null)}
          onSaved={gear.refetch}
        />
      )}
      <ConfirmDialog
        open={!!del}
        busy={busy}
        title="Are you sure?"
        message={`Do you really want to delete "${del?.name}"? This can't be undone.`}
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
        onConfirm={remove}
        onCancel={() => setDel(null)}
      />
    </>
  );
}
