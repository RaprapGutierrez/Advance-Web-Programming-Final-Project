import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api, errMsg } from "../lib/api";
import { bookingSchema, type BookingValues } from "../lib/schemas";
import { hourLabel, peso, today } from "../lib/format";
import { Async, Field } from "./ui";
import Select from "./Select";
import { useToast } from "./Toast";
import { useAuth } from "../lib/auth";
import type { Booking, Equipment, Quote, Renter, Studio } from "../types";

function Inner({
  renters,
  studios,
  gear,
  initial,
}: {
  renters: Renter[];
  studios: Studio[];
  gear: Equipment[];
  initial?: Booking;
}) {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { user, hasRole } = useAuth();
  const isCustomer = !hasRole("owner");
  const me = renters.find(
    (r) =>
      r.name.trim().toLowerCase() === (user?.name ?? "").trim().toLowerCase(),
  );
  const startQ = Number(sp.get("start")) || 10;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      renterId: initial?.renterId ?? (isCustomer ? me?.id : undefined) ?? "",
      studioId: initial?.studioId ?? sp.get("studio") ?? studios[0]?.id ?? "",
      date: initial?.date ?? sp.get("date") ?? today(),
      startHour: initial?.startHour ?? startQ,
      endHour: initial?.endHour ?? startQ + 2,
      guests: initial?.guests ?? 2,
      equipmentIds: initial?.equipmentIds ?? [],
    },
  });
  const v = watch();
  const studio = studios.find((s) => s.id === v.studioId);
  const range = studio
    ? Array.from(
        { length: studio.closeHour - studio.openHour + 1 },
        (_, i) => studio.openHour + i,
      )
    : [];
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState("");
  const key = JSON.stringify([
    v.renterId,
    v.studioId,
    v.date,
    v.startHour,
    v.endHour,
    v.guests,
    v.equipmentIds,
  ]);

  // Ask the API for a live price and conflict check as the form changes.
  useEffect(() => {
    if (!v.renterId) {
      setQuote(null);
      setQuoteErr("Choose a renter to see the price.");
      return;
    }
    const t = setTimeout(() => {
      api
        .post<Quote>("/bookings/quote", { ...v, bookingId: initial?.id })
        .then((r) => {
          setQuote(r.data);
          setQuoteErr("");
        })
        .catch((e) => {
          setQuote(null);
          setQuoteErr(errMsg(e));
        });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggleGear = (id: string) =>
    setValue(
      "equipmentIds",
      v.equipmentIds.includes(id)
        ? v.equipmentIds.filter((x) => x !== id)
        : [...v.equipmentIds, id],
      { shouldDirty: true },
    );

  async function onSubmit(values: BookingValues) {
    try {
      if (initial) await api.put(`/bookings/${initial.id}`, values);
      else await api.post("/bookings", values);
      toast(initial ? "Booking updated" : "Booking created");
      nav(`/calendar?date=${values.date}&studio=${values.studioId}`);
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 lg:grid-cols-5"
      noValidate
    >
      <div className="card space-y-5 lg:col-span-3">
        <h2 className="text-xl font-bold">Booking details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={isCustomer ? "Booking for" : "Renter"}
            error={errors.renterId?.message}
          >
            <Select
              value={v.renterId}
              onChange={(val) =>
                setValue("renterId", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={[
                { value: "", label: "Choose a renter" },
                ...renters
                  .filter((r) => !isCustomer || !me || r.id === me.id)
                  .map((r) => ({
                    value: r.id,
                    label: `${r.name} (${r.tier})`,
                  })),
              ]}
            />
          </Field>
          <Field label="Studio" error={errors.studioId?.message}>
            <Select
              value={v.studioId}
              onChange={(val) =>
                setValue("studioId", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={studios.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          <Field label="Date" error={errors.date?.message}>
            <input type="date" className="input" {...register("date")} />
          </Field>
          <Field
            label={`Guests${studio ? ` (max ${studio.capacity})` : ""}`}
            error={errors.guests?.message}
          >
            <input
              type="number"
              className="input"
              {...register("guests", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Start" error={errors.startHour?.message}>
            <Select
              value={v.startHour}
              onChange={(val) =>
                setValue("startHour", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={range
                .slice(0, -1)
                .map((h) => ({ value: h, label: hourLabel(h) }))}
            />
          </Field>
          <Field label="End" error={errors.endHour?.message}>
            <Select
              value={v.endHour}
              onChange={(val) =>
                setValue("endHour", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              options={range
                .slice(1)
                .map((h) => ({ value: h, label: hourLabel(h) }))}
            />
          </Field>
        </div>
        <fieldset>
          <legend className="label">Add-ons</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {gear.map((g) => (
              <label
                key={g.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3.5 transition hover:border-brand-500 hover:shadow-card has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={v.equipmentIds.includes(g.id)}
                  onChange={() => toggleGear(g.id)}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {g.name}
                  </span>
                  <span className="text-xs text-ink-500">{peso(g.fee)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-2 lg:self-start">
        <div className="card">
          <h2 className="text-xl font-bold">Price</h2>
          {quote ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>
                  {quote.peakHours} peak + {quote.offPeakHours} off-peak hrs
                </dt>
                <dd>{peso(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Add-ons</dt>
                <dd>{peso(quote.addOns)}</dd>
              </div>
              <div className="flex justify-between text-ok-600">
                <dt>
                  Loyalty discount ({Math.round(quote.discountRate * 100)}%)
                </dt>
                <dd>−{peso(quote.discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 font-display text-3xl font-extrabold">
                <dt>Total</dt>
                <dd>{peso(quote.total)}</dd>
              </div>
            </dl>
          ) : (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-alert-100 p-3 text-sm font-medium text-alert-700"
            >
              {quoteErr || "Checking…"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-spot flex-1 py-3"
            disabled={isSubmitting || !quote}
          >
            {isSubmitting
              ? "Saving…"
              : initial
                ? "Save changes"
                : "Create booking"}
          </button>
          <Link to="/calendar" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </aside>
    </form>
  );
}

export default function BookingForm({ initial }: { initial?: Booking }) {
  const renters = useFetch<Renter[]>("/renters");
  const studios = useFetch<Studio[]>("/studios");
  const gear = useFetch<Equipment[]>("/equipment");
  const all = [renters, studios, gear];
  return (
    <Async
      loading={all.some((x) => x.loading)}
      error={all.find((x) => x.error)?.error ?? null}
      retry={() => all.forEach((x) => x.refetch())}
    >
      {renters.data && studios.data && gear.data && (
        <Inner
          renters={renters.data}
          studios={studios.data}
          gear={gear.data}
          initial={initial}
        />
      )}
    </Async>
  );
}
