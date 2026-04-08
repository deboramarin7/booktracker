import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  draggable?: boolean;
  style?: React.CSSProperties;
}

export function BookCoverImage({
  src,
  alt = "",
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

  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15", fallbackClassName || className)}>
      <BookOpen className={cn("h-6 w-6 text-primary/40", iconClassName)} />
    </div>
  );
}
