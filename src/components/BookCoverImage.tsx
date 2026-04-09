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

// Genera un color de fondo consistente basado en el título
function getColorFromTitle(title: string): string {
  const colors = [
    "from-violet-600/80 to-purple-800/80",
    "from-emerald-600/80 to-teal-800/80",
    "from-rose-600/80 to-pink-800/80",
    "from-amber-600/80 to-orange-800/80",
    "from-sky-600/80 to-blue-800/80",
    "from-indigo-600/80 to-violet-800/80",
    "from-fuchsia-600/80 to-pink-800/80",
    "from-cyan-600/80 to-sky-800/80",
  ];
  if (!title) return colors[0];
  const index = title.charCodeAt(0) % colors.length;
  return colors[index];
}

// Extrae las iniciales del título (máx 2 caracteres)
function getInitials(title: string): string {
  if (!title) return "?";
  const words = title.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function BookCoverImage({
  src,
  alt = "",
  title = "",
  className,
  fallbackClassName,
  iconClassName,
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

  const initials = getInitials(title || alt);
  const gradient = getColorFromTitle(title || alt);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-gradient-to-br select-none",
        gradient,
        fallbackClassName || className
      )}
      style={style}
    >
      <span
        className={cn(
          "font-bold text-white/90 tracking-wide leading-none",
          // Tamaño de fuente relativo al contenedor
          "text-xl",
          iconClassName
        )}
      >
        {initials}
      </span>
    </div>
  );
}