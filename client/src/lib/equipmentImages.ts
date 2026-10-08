import type { Equipment } from "../types";

const byKeyword: [string, string][] = [
  ["speaker", "/images/equipment/Bluetooth_speaker.jpg"],
  ["backdrop", "/images/equipment/Backdrop_set.jpg"],
  ["background", "/images/equipment/Backdrop_set.jpg"],
  ["drum", "/images/equipment/Drum_kit.jpeg"],
  ["softbox", "/images/equipment/Softbox_lights.jpg"],
  ["light", "/images/equipment/Softbox_lights.jpg"],
  ["mic", "/images/equipment/Condenser_mic.jpeg"],
];

const typeByKeyword: [string, string][] = [
  ["speaker", "Audio"],
  ["mic", "Audio"],
  ["drum", "Instrument"],
  ["softbox", "Lighting"],
  ["light", "Lighting"],
  ["backdrop", "Backdrop"],
  ["background", "Backdrop"],
];

export function equipmentType(g: Pick<Equipment, "type" | "name">) {
  if (g.type) return g.type;
  const text = g.name.toLowerCase();
  return typeByKeyword.find(([k]) => text.includes(k))?.[1] ?? "Other";
}

export function equipmentImage(g: Pick<Equipment, "image" | "name">) {
  if (g.image) return g.image;
  const text = g.name.toLowerCase();
  return byKeyword.find(([k]) => text.includes(k))?.[1];
}
