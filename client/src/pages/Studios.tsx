import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api, errMsg } from "../lib/api";
import { Async, ConfirmDialog, Empty, PageHeader } from "../components/ui";
import { EquipmentModal, StudioModal } from "../components/forms";
import { useToast } from "../components/Toast";
import { hourLabel, peso } from "../lib/format";
import type { Equipment, Studio } from "../types";
import { useAuth } from "../lib/auth";
import Thumb from "../components/Thumb";
import { studioImage } from "../lib/studioImages";
import { equipmentImage, equipmentType } from "../lib/equipmentImages";

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
          ) : undefined
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
                    <p className="mt-3 text-sm text-ink-500">
                      Open {hourLabel(s.openHour)} to {hourLabel(s.closeHour)}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
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
