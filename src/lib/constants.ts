import type { ReadingStatus } from "@/hooks/useBooks";

export const GENRES = [
  "Contemporáneo",
  "Fantasía",
  "Ficción",
  "Romántica",
  "Romantasy",
  "Sport Romance",
  "Thriller",
];

export const FORMATS = ["Físico", "Digital"];
export const SOURCES = ["Comprado", "Gratis"];

export const STATUSES: { value: ReadingStatus; label: string }[] = [
  { value: "want-to-read", label: "Quiero leer" },
  { value: "reading", label: "Leyendo" },
  { value: "finished", label: "Terminado" },
];

export const STATUS_LABELS: Record<string, string> = {
  "want-to-read": "Quiero leer",
  reading: "Leyendo",
  finished: "Terminado",
};

// Color classes for genres — using soft, desaturated tones
export const GENRE_COLORS: Record<string, string> = {
  "Contemporáneo": "bg-[hsl(200,45%,45%)] text-[hsl(0,0%,100%)]",
  "Fantasía": "bg-[hsl(270,40%,50%)] text-[hsl(0,0%,100%)]",
  "Ficción": "bg-[hsl(30,55%,50%)] text-[hsl(0,0%,100%)]",
  "Romántica": "bg-[hsl(340,50%,55%)] text-[hsl(0,0%,100%)]",
  "Romantasy": "bg-[hsl(300,35%,50%)] text-[hsl(0,0%,100%)]",
  "Sport Romance": "bg-[hsl(15,55%,50%)] text-[hsl(0,0%,100%)]",
  "Thriller": "bg-[hsl(0,0%,30%)] text-[hsl(0,0%,100%)]",
};

// Color classes for statuses
export const STATUS_COLORS: Record<string, string> = {
  "want-to-read": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  reading: "bg-primary text-primary-foreground",
  finished: "bg-finished text-finished-foreground",
};

// Color classes for formats
export const FORMAT_COLORS: Record<string, string> = {
  "Físico": "bg-[hsl(25,50%,50%)] text-[hsl(0,0%,100%)]",
  "Digital": "bg-[hsl(195,45%,45%)] text-[hsl(0,0%,100%)]",
};
