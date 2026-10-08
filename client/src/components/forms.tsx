import { useState, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import Select from "./Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, errMsg } from "../lib/api";
import {
  equipmentSchema,
  METHODS,
  paymentSchema,
  renterSchema,
  studioSchema,
  TYPES,
  type EquipmentValues,
  type PaymentValues,
  type RenterValues,
  type StudioValues,
} from "../lib/schemas";
import { hourLabel, peso } from "../lib/format";
import { Field, Modal } from "./ui";
import { useToast } from "./Toast";
import type { Booking, Equipment, Renter, Studio } from "../types";
import { studioImage } from "../lib/studioImages";
import { equipmentImage } from "../lib/equipmentImages";

interface Done {
  onClose: () => void;
  onSaved: () => void;
}
const hours = Array.from({ length: 25 }, (_, h) => h);
const Actions = ({
  busy,
  label,
  onClose,
}: {
  busy: boolean;
  label: string;
  onClose: () => void;
}) => (
  <div className="flex gap-2 border-t border-line pt-4">
    <button className="btn btn-primary flex-1" disabled={busy}>
      {busy ? "Saving…" : label}
    </button>
    <button type="button" className="btn btn-ghost" onClick={onClose}>
      Cancel
    </button>
  </div>
);

const EQUIPMENT_TYPES = [
  "Audio",
  "Lighting",
  "Backdrop",
  "Instrument",
  "Other",
];

function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const toast = useToast();
  function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/"))
      return toast("Please choose an image file", "error");
    if (f.size > 2 * 1024 * 1024)
      return toast("Image must be under 2 MB", "error");
    const r = new FileReader();
    r.onload = () => onChange(r.result as string);
    r.readAsDataURL(f);
  }
  return (
    <Field label={label} error={undefined}>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-16 w-24 rounded-lg object-cover"
          />
        ) : (
          <div className="h-20 w-28 rounded-lg border border-dashed border-line bg-line" />
        )}
        <div className="flex flex-col gap-1">
          <label className="btn btn-ghost cursor-pointer px-3 py-2 text-sm">
            {value ? "Change image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              onChange={pick}
              className="sr-only"
            />
          </label>
          {value && (
            <button
              type="button"
              className="btn btn-ghost px-3 py-1 text-sm"
              onClick={() => onChange(undefined)}
            >
              Remove image
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

function GalleryPicker({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toast = useToast();
  async function add(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const ok = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast("Please choose image files only", "error");
        return false;
      }
      if (f.size > 2 * 1024 * 1024) {
        toast(`${f.name} is over 2 MB`, "error");
        return false;
      }
      return true;
    });
    const urls = await Promise.all(
      ok.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(f);
          }),
      ),
    );
    if (urls.length) onChange([...values, ...urls]);
  }
  return (
    <Field label={label} error={undefined}>
      <div className="flex flex-wrap gap-3">
        {values.map((src, i) => (
          <div key={i} className="group relative h-20 w-28">
            <img
              src={src}
              alt=""
              className="h-full w-full rounded-lg object-cover"
            />
            {i === 0 && (
              <span className="badge absolute bottom-1 left-1 bg-white/90 text-brand-700">
                Cover
              </span>
            )}
            <button
              type="button"
              aria-label="Remove image"
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <label className="btn btn-ghost h-20 w-28 cursor-pointer border-dashed px-3 py-2 text-sm">
          + Add image
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={add}
            className="sr-only"
          />
        </label>
      </div>
    </Field>
  );
}

export function StudioModal({
  studio,
  onClose,
  onSaved,
}: Done & { studio?: Studio }) {
  const toast = useToast();
  const [images, setImages] = useState<string[]>(
    studio?.images?.length
      ? studio.images
      : studio && studioImage(studio)
        ? [studioImage(studio)!]
        : [],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<StudioValues>({
    resolver: zodResolver(studioSchema),
    defaultValues: studio
      ? { ...studio, type: studio.type as StudioValues["type"] }
      : {
          type: "Music",
          openHour: 9,
          closeHour: 21,
          description: "",
          name: "",
        },
  });
  async function onSubmit(v: StudioValues) {
    try {
      const body = { ...v, image: images[0] ?? "", images };
      if (studio) await api.put(`/studios/${studio.id}`, body);
      else await api.post("/studios", body);
      toast(studio ? "Studio updated" : "Studio added");
      onSaved();
      onClose();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }
  return (
    <Modal title={studio ? "Edit studio" : "Add studio"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Name" error={errors.name?.message}>
          <input className="input" {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" error={errors.type?.message}>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={TYPES.map((t) => ({ value: t, label: t }))}
                />
              )}
            />
          </Field>
          <Field label="Capacity (people)" error={errors.capacity?.message}>
            <input
              type="number"
              className="input"
              {...register("capacity", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Peak rate / hr (₱)" error={errors.peakRate?.message}>
            <input
              type="number"
              className="input"
              {...register("peakRate", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Off-peak rate / hr (₱)"
            error={errors.offPeakRate?.message}
          >
            <input
              type="number"
              className="input"
              {...register("offPeakRate", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Opens" error={errors.openHour?.message}>
            <Controller
              control={control}
              name="openHour"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={hours
                    .slice(0, 24)
                    .map((h) => ({ value: h, label: hourLabel(h) }))}
                />
              )}
            />
          </Field>
          <Field label="Closes" error={errors.closeHour?.message}>
            <Controller
              control={control}
              name="closeHour"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={field.onChange}
                  options={hours
                    .slice(1)
                    .map((h) => ({ value: h, label: hourLabel(h) }))}
                />
              )}
            />
          </Field>
        </div>
        <Field label="Description" error={errors.description?.message}>
          <input className="input" {...register("description")} />
        </Field>
        <GalleryPicker
          label="Studio images"
          values={images}
          onChange={setImages}
        />
        <Actions
          busy={isSubmitting}
          label={studio ? "Save changes" : "Add studio"}
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

export function RenterModal({
  renter,
  onClose,
  onSaved,
}: Done & { renter?: Renter }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RenterValues>({
    resolver: zodResolver(renterSchema),
    defaultValues: {
      name: renter?.name ?? "",
      email: renter?.email ?? "",
      phone: renter?.phone ?? "",
    },
  });
  async function onSubmit(v: RenterValues) {
    try {
      if (renter) await api.put(`/renters/${renter.id}`, v);
      else await api.post("/renters", v);
      toast(renter ? "Renter updated" : "Renter added");
      onSaved();
      onClose();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }
  return (
    <Modal title={renter ? "Edit renter" : "Add renter"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message}>
          <input className="input" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input className="input" {...register("email")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input className="input" {...register("phone")} />
        </Field>
        <Actions
          busy={isSubmitting}
          label={renter ? "Save changes" : "Add renter"}
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

export function EquipmentModal({
  item,
  onClose,
  onSaved,
}: Done & { item?: Equipment }) {
  const toast = useToast();
  const [images, setImages] = useState<string[]>(
    item?.images?.length
      ? item.images
      : item && equipmentImage(item)
        ? [equipmentImage(item)!]
        : [],
  );
  const [kind, setKind] = useState<string>(item?.type ?? "Audio");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: item ? { ...item } : { name: "", quantity: 1 },
  });
  async function onSubmit(v: EquipmentValues) {
    try {
      const body = { ...v, image: images[0] ?? "", images, type: kind };
      if (item) await api.put(`/equipment/${item.id}`, body);
      else await api.post("/equipment", body);
      toast(item ? "Add-on updated" : "Add-on added");
      onSaved();
      onClose();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }
  return (
    <Modal title={item ? "Edit add-on" : "Add an add-on"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Name" error={errors.name?.message}>
          <input className="input" {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fee per booking (₱)" error={errors.fee?.message}>
            <input
              type="number"
              className="input"
              {...register("fee", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Units owned" error={errors.quantity?.message}>
            <input
              type="number"
              className="input"
              {...register("quantity", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Field label="Type of equipment" error={undefined}>
          <Select
            value={kind}
            onChange={setKind}
            options={EQUIPMENT_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </Field>
        <GalleryPicker
          label="Equipment images"
          values={images}
          onChange={setImages}
        />
        <Actions
          busy={isSubmitting}
          label={item ? "Save changes" : "Add add-on"}
          onClose={onClose}
        />
      </form>
    </Modal>
  );
}

export function PaymentModal({
  booking,
  onClose,
  onSaved,
}: Done & { booking: Booking }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: booking.balanceDue, method: "gcash" },
  });
  async function onSubmit(v: PaymentValues) {
    try {
      await api.post("/payments", { ...v, bookingId: booking.id });
      toast("Payment recorded");
      onSaved();
      onClose();
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }
  return (
    <Modal title="Record payment" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-500">
        {booking.renterName} · {booking.studioName} · {peso(booking.balanceDue)}{" "}
        still due
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Amount (₱)" error={errors.amount?.message}>
          <input
            type="number"
            step="0.01"
            className="input"
            {...register("amount", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Method" error={errors.method?.message}>
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <Select
                className="capitalize"
                value={field.value}
                onChange={field.onChange}
                options={METHODS.map((m) => ({ value: m, label: m }))}
              />
            )}
          />
        </Field>
        <Actions busy={isSubmitting} label="Record payment" onClose={onClose} />
      </form>
    </Modal>
  );
}
