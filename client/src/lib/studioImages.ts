import type { Studio } from "../types";

const byKeyword: [string, string][] = [
  ["dance", "/images/studios/dance.jpeg"],
  ["photo", "/images/studios/photo.jpeg"],
  ["podcast", "/images/studios/podcast.jpeg"],
  ["music", "/images/studios/music.jpeg"],
  ["record", "/images/studios/music.jpeg"],
  ["band", "/images/studios/music.jpeg"],
];

export function studioImage(s: Pick<Studio, "image" | "type" | "name">) {
  if (s.image) return s.image;
  const text = `${s.type} ${s.name}`.toLowerCase();
  return byKeyword.find(([k]) => text.includes(k))?.[1];
}
