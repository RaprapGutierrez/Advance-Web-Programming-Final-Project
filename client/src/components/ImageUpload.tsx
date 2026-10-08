import { useRef, useState } from "react";

const MAX = 1200;

function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

export default function ImageUpload({
  value,
  onChange,
  label = "Photo",
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setErr("Please choose an image file.");
    if (file.size > 8 * 1024 * 1024)
      return setErr("Image is too large (max 8 MB).");
    setErr("");
    try {
      onChange(await shrink(file));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{label}</p>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-brand-900 text-xs text-white/60">
          {value ? (
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            "No photo"
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost px-3 py-2"
            onClick={() => input.current?.click()}
          >
            {value ? "Change photo" : "Upload photo"}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost px-3 py-2 text-alert-600"
              onClick={() => onChange(undefined)}
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {err && <p className="mt-1 text-sm text-alert-600">{err}</p>}
    </div>
  );
}
