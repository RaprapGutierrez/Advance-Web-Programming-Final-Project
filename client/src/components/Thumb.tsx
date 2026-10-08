import { useEffect, useState } from "react";

export default function Thumb({
  src,
  alt,
  className = "",
  badge,
}: {
  src?: string;
  alt: string;
  className?: string;
  badge?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-brand-900 ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center font-display text-2xl font-extrabold text-white/60">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
      {badge && (
        <span className="badge absolute left-2 top-2 bg-white/90 text-brand-700">
          {badge}
        </span>
      )}
    </div>
  );
}
