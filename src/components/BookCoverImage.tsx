import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookCoverImageProps {
  src?: string | null;
  alt?: string;
  title?: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  draggable?: boolean;
  style?: React.CSSProperties;
}

const PALETTES = [
  { from: "#7c3aed", to: "#4c1d95" },
  { from: "#059669", to: "#064e3b" },
  { from: "#e11d48", to: "#881337" },
  { from: "#d97706", to: "#78350f" },
  { from: "#0284c7", to: "#0c4a6e" },
  { from: "#4f46e5", to: "#312e81" },
  { from: "#c026d3", to: "#701a75" },
  { from: "#0891b2", to: "#164e63" },
];

function getPaletteFromTitle(title: string) {
  if (!title) return PALETTES[0];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

function getInitials(title: string): string {
  if (!title) return "?";
  const words = title.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function BookCoverImage({
  src,
  alt = "",
  title = "",
  className,
  fallbackClassName,
  draggable,
  style,
}: BookCoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        draggable={draggable}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }

  const label = title || alt;
  const initials = getInitials(label);
  const palette = getPaletteFromTitle(label);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center select-none overflow-hidden",
        fallbackClassName || className
      )}
      style={{
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        ...style,
      }}
    >
      <span
        className="font-bold text-white tracking-widest leading-none drop-shadow"
        style={{ fontSize: "clamp(0.85rem, 3vw, 1.5rem)" }}
      >
        {initials}
      </span>
      {label && (
        <span
          className="text-white/50 mt-1 px-1 text-center leading-tight font-medium"
          style={{ fontSize: "clamp(0.45rem, 1.2vw, 0.6rem)", maxWidth: "90%" }}
        >
          {label.length > 18 ? label.slice(0, 16) + "…" : label}
        </span>
      )}
    </div>
  );
}
