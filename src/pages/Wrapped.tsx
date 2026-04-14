import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useBooksContext } from "@/components/Layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Heart,
  Flame,
  X,
  ImageDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getYearFromBook(book: {
  endDate?: string;
  startDate?: string;
  addedAt: string;
}): number {
  const dateStr = book.endDate || book.startDate || book.addedAt;
  if (!dateStr) return new Date().getFullYear();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function AnimatedNumber({
  value,
  suffix = "",
  delay = 0,
}: {
  value: number;
  suffix?: string;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const duration = 1800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    animate();
  }, [value, started]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-6 w-6 transition-all duration-500 ${
            i <= Math.round(rating)
              ? "text-amber-400 fill-amber-400 scale-110"
              : "text-white/20"
          }`}
          style={{ transitionDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

function WrappedSlide({
  children,
  index,
  currentSlide,
  gradient = "from-emerald-950 via-gray-950 to-gray-950",
}: {
  children: React.ReactNode;
  index: number;
  currentSlide: number;
  gradient?: string;
}) {
  const isActive = index === currentSlide;
  const isPast = index < currentSlide;

  if (Math.abs(index - currentSlide) > 1) return null;

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isActive
          ? "opacity-100 translate-y-0 scale-100"
          : isPast
          ? "opacity-0 -translate-y-8 scale-[0.97] pointer-events-none"
          : "opacity-0 translate-y-8 scale-[0.97] pointer-events-none"
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" />
      <div className="relative z-10 w-full max-w-2xl mx-auto px-8 text-center">
        {children}
      </div>
    </div>
  );
}

function GlowOrb({
  color = "emerald",
  size = "lg",
  position = "top-left",
}: {
  color?: string;
  size?: "sm" | "md" | "lg";
  position?: string;
}) {
  const sizes = { sm: "w-32 h-32", md: "w-48 h-48", lg: "w-72 h-72" };
  const positions: Record<string, string> = {
    "top-left": "top-0 left-0 -translate-x-1/3 -translate-y-1/3",
    "top-right": "top-0 right-0 translate-x-1/3 -translate-y-1/3",
    "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/3",
    "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/3",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/15",
    amber: "bg-amber-500/10",
    purple: "bg-purple-500/10",
    rose: "bg-rose-500/10",
  };

  return (
    <div
      className={`absolute ${positions[position] || positions.center} ${
        sizes[size]
      } ${colors[color] || colors.emerald} rounded-full blur-3xl pointer-events-none`}
    />
  );
}

export default function Wrapped() {
  const { books } = useBooksContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const years = useMemo(() => {
    const s = new Set<number>();
    s.add(new Date().getFullYear());
    books.forEach((b) => s.add(getYearFromBook(b)));
    return Array.from(s).sort((a, b) => b - a);
  }, [books]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const yearBooks = useMemo(
    () =>
      books.filter(
        (b) => b.status === "finished" && getYearFromBook(b) === selectedYear
      ),
    [books, selectedYear]
  );

  const totalPages = useMemo(
    () => yearBooks.reduce((s, b) => s + b.totalPages, 0),
    [yearBooks]
  );

  const uniqueAuthors = useMemo(
    () => new Set(yearBooks.map((b) => b.author)).size,
    [yearBooks]
  );

  const uniqueGenres = useMemo(
    () => new Set(yearBooks.filter((b) => b.genre).map((b) => b.genre)).size,
    [yearBooks]
  );

  const topAuthor = useMemo(() => {
    const map: Record<string, number> = {};
    yearBooks.forEach((b) => {
      map[b.author] = (map[b.author] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || null;
  }, [yearBooks]);

  const topGenre = useMemo(() => {
    const map: Record<string, number> = {};
    yearBooks.forEach((b) => {
      if (b.genre) map[b.genre] = (map[b.genre] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || null;
  }, [yearBooks]);

  const avgRating = useMemo(() => {
    const rated = yearBooks.filter((b) => b.rating > 0);
    return rated.length > 0
      ? rated.reduce((s, b) => s + b.rating, 0) / rated.length
      : 0;
  }, [yearBooks]);

  const topRatedBook = useMemo(() => {
    const rated = yearBooks
      .filter((b) => b.rating > 0)
      .sort((a, b) => b.rating - a.rating);
    return rated[0] || null;
  }, [yearBooks]);

  const bestMonth = useMemo(() => {
    const map: Record<number, number> = {};
    yearBooks.forEach((b) => {
      const d = new Date(b.endDate || b.startDate || b.addedAt);
      map[d.getMonth()] = (map[d.getMonth()] || 0) + 1;
    });
    const entries = Object.entries(map).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
    return entries[0]
      ? {
          month: MONTH_NAMES[Number(entries[0][0])],
          count: Number(entries[0][1]),
        }
      : null;
  }, [yearBooks]);

  const readingTimeStats = useMemo(() => {
    const withDates = yearBooks.filter((b) => b.startDate && b.endDate);
    if (!withDates.length) return null;

    const times = withDates.map((b) => {
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(b.endDate!).getTime() - new Date(b.startDate!).getTime()) /
            86400000
        )
      );
      return { book: b, days };
    });

    const avg = times.reduce((s, t) => s + t.days, 0) / times.length;
    const fastest = times.reduce((min, t) => (t.days < min.days ? t : min), times[0]);

    return { avg: Math.round(avg), fastest };
  }, [yearBooks]);

  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map(
      (_, i) =>
        yearBooks.filter(
          (b) =>
            new Date(b.endDate || b.startDate || b.addedAt).getMonth() === i
        ).length
    );
  }, [yearBooks]);

  const maxMonthly = Math.max(...monthlyData, 1);

  const maxStreak = useMemo(() => {
    const dates = yearBooks
      .map((b) => b.endDate || b.startDate)
      .filter(Boolean)
      .map((d) => new Date(d!).toISOString().split("T")[0])
      .sort();

    if (!dates.length) return 0;

    const unique = [...new Set(dates)];
    let max = 1;
    let current = 1;

    for (let i = 1; i < unique.length; i++) {
      const prev = new Date(unique[i - 1]);
      const curr = new Date(unique[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;

      if (diff <= 30) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 1;
      }
    }

    return max;
  }, [yearBooks]);

  const totalSlides = yearBooks.length > 0 ? 8 : 1;

  const next = useCallback(
    () => setCurrentSlide((s) => Math.min(s + 1, totalSlides - 1)),
    [totalSlides]
  );

  const prev = useCallback(() => setCurrentSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    setCurrentSlide(0);
  }, [selectedYear]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      }
      if (e.key === "Escape") setIsFullscreen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 50) {
      if (dy < 0) next();
      else prev();
    } else if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }

    touchStartRef.current = null;
  };

  const wrappedContent = (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${
        isExporting
          ? "fixed inset-0 z-[9999]"
          : isFullscreen
          ? "fixed inset-0 z-50"
          : "rounded-2xl"
      }`}
      style={
        isExporting
          ? { width: "1080px", height: "1920px", top: 0, left: 0, margin: 0 }
          : { minHeight: isFullscreen ? "100vh" : "80vh" }
      }
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <WrappedSlide
        index={0}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-emerald-950/50 to-slate-950"
      >
        <GlowOrb color="emerald" size="lg" position="center" />
        <div className="space-y-8">
          <p className="text-xs tracking-[0.45em] text-emerald-400/85 uppercase">
            Tu año lector · {selectedYear}
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" />
            </div>
            <h2 className="relative text-[170px] sm:text-[280px] font-black text-white leading-[0.8] font-display">
              <AnimatedNumber value={yearBooks.length} />
            </h2>
          </div>

          <p className="text-xl sm:text-2xl text-white/65 font-body">
            libros terminados
          </p>

          <div className="flex justify-center gap-2 pt-2 flex-wrap">
            {yearBooks.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="w-16 h-24 sm:w-20 sm:h-28 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/30"
              >
                {b.coverUrl ? (
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-900/30 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-emerald-400/40" />
                  </div>
                )}
              </div>
            ))}
            {yearBooks.length > 5 && (
              <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 text-lg font-semibold">
                +{yearBooks.length - 5}
              </div>
            )}
          </div>
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={1}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-emerald-950/35 to-slate-950"
      >
        <GlowOrb color="emerald" size="md" position="top-right" />
        <div className="space-y-8">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <BookOpen className="h-8 w-8 text-emerald-400" />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
            </div>
            <h2 className="relative text-[145px] sm:text-[220px] font-black text-white leading-[0.8] font-display">
              <AnimatedNumber value={totalPages} />
            </h2>
          </div>

          <p className="text-xl sm:text-2xl text-white/65 font-body">
            páginas leídas
          </p>

          <p className="text-sm sm:text-base text-white/40 font-body">
            ≈ {Math.round(totalPages / 250)} novelas estándar
          </p>
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={2}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-purple-950/35 to-slate-950"
      >
        <GlowOrb color="purple" size="lg" position="bottom-left" />
        <div className="space-y-8">
          <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <Trophy className="h-8 w-8 text-purple-400" />
          </div>
          <p className="text-purple-300/80 text-sm uppercase tracking-[0.3em]">
            Tu mejor mes
          </p>

          {bestMonth ? (
            <div className="space-y-3">
              <h2 className="text-5xl sm:text-7xl font-bold text-white leading-none font-display">
                {bestMonth.month}
              </h2>
              <p className="text-2xl text-purple-300 font-semibold">
                {bestMonth.count} {bestMonth.count === 1 ? "libro" : "libros"}
              </p>
            </div>
          ) : (
            <p className="text-white/40">Sin datos suficientes</p>
          )}

          <div className="flex items-end justify-center gap-1 h-24 pt-2">
            {monthlyData.map((count, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1 max-w-[24px]">
                <div
                  className="w-full rounded-t transition-all duration-700 bg-gradient-to-t from-purple-500/70 to-purple-300/90"
                  style={{
                    height: `${Math.max(count > 0 ? 6 : 2, (count / maxMonthly) * 70)}px`,
                    transitionDelay: `${i * 50}ms`,
                  }}
                />
                <span className="text-[7px] text-white/30">
                  {MONTH_NAMES[i].slice(0, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={3}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-emerald-950/28 to-slate-950"
      >
        <GlowOrb color="emerald" size="md" position="top-left" />
        <div className="space-y-8">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Layers className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-emerald-300/80 text-sm uppercase tracking-[0.3em]">
            Género favorito
          </p>
          {topGenre ? (
            <div className="wrapped-theme space-y-4">
              <h2 className="text-4xl sm:text-6xl font-bold text-white leading-tight font-display">
                {topGenre[0]}
              </h2>
              <p className="text-lg text-emerald-300">
                {topGenre[1]} {topGenre[1] === 1 ? "libro" : "libros"} leídos
              </p>
            </div>
          ) : (
            <p className="text-white/40">Sin datos de género</p>
          )}
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={4}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-amber-950/22 to-slate-950"
      >
        <GlowOrb color="amber" size="lg" position="bottom-right" />
        <div className="space-y-8">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="h-8 w-8 text-amber-400" />
          </div>
          <p className="text-amber-300/80 text-sm uppercase tracking-[0.3em]">
            Autor más leído
          </p>

          {topAuthor ? (
            <div className="space-y-5">
              <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight font-display">
                {topAuthor[0]}
              </h2>
              <p className="text-lg text-amber-300">
                {topAuthor[1]} {topAuthor[1] === 1 ? "libro" : "libros"}
              </p>

              <div className="flex justify-center gap-2 flex-wrap">
                {yearBooks
                  .filter((b) => b.author === topAuthor[0])
                  .slice(0, 4)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg"
                    >
                      {b.coverUrl ? (
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-900/30 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-amber-400/30" />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-white/40">Sin datos</p>
          )}
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={5}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-amber-950/30 to-slate-950"
      >
        <GlowOrb color="amber" size="lg" position="center" />
        <div className="space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-amber-300/80 text-sm uppercase tracking-[0.3em]">
            Libro del año
          </p>

          {topRatedBook ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                {topRatedBook.coverUrl ? (
                  <img
                    src={topRatedBook.coverUrl}
                    alt={topRatedBook.title}
                    className="w-40 h-56 object-cover rounded-2xl shadow-2xl shadow-amber-500/20 ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-40 h-56 rounded-2xl bg-amber-900/20 flex items-center justify-center ring-1 ring-white/10">
                    <BookOpen className="h-12 w-12 text-amber-400/30" />
                  </div>
                )}
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white font-display">
                {topRatedBook.title}
              </h3>
              <p className="text-white/50">{topRatedBook.author}</p>
              <StarRating rating={topRatedBook.rating} />
            </div>
          ) : (
            <p className="text-white/40">Valora tus libros para ver tu favorito</p>
          )}
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={6}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-rose-950/22 to-slate-950"
      >
        <GlowOrb color="rose" size="md" position="top-right" />
        <div className="space-y-8">
          <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <Flame className="h-8 w-8 text-rose-400" />
          </div>
          <p className="text-rose-300/80 text-sm uppercase tracking-[0.3em]">
            Tu ritmo
          </p>

          <div className="space-y-6">
            {readingTimeStats && (
              <div className="space-y-1">
                <h2 className="text-6xl sm:text-7xl font-bold text-white font-display">
                  <AnimatedNumber value={readingTimeStats.avg} />
                </h2>
                <p className="text-white/50">días de media por libro</p>
                <p className="text-sm text-rose-300/60 pt-2">
                  ⚡ Más rápido:{" "}
                  <span className="text-white/70">
                    {readingTimeStats.fastest.book.title}
                  </span>{" "}
                  en {readingTimeStats.fastest.days} días
                </p>
              </div>
            )}

            {maxStreak > 1 && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                <p className="text-3xl font-bold text-white font-display">
                  <AnimatedNumber value={maxStreak} delay={400} /> meses
                </p>
                <p className="text-white/50 text-sm">racha máxima leyendo</p>
              </div>
            )}
          </div>
        </div>
      </WrappedSlide>

      <WrappedSlide
        index={7}
        currentSlide={currentSlide}
        gradient="from-slate-950 via-emerald-950/40 to-slate-950"
      >
        <GlowOrb color="emerald" size="lg" position="center" />
        <div className="space-y-8">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Heart className="h-8 w-8 text-emerald-400 fill-emerald-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
            Tu {selectedYear} en libros
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: yearBooks.length, label: "Libros" },
              { value: totalPages, label: "Páginas" },
              { value: uniqueAuthors, label: "Autores" },
              { value: uniqueGenres, label: "Géneros" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <p className="text-3xl font-bold text-emerald-400 font-display">
                  <AnimatedNumber value={stat.value} delay={i * 150} />
                </p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>

          {avgRating > 0 && (
            <p className="text-white/50 text-sm">
              Valoración media:{" "}
              <span className="text-amber-400 font-semibold">
                {avgRating.toFixed(1)} ★
              </span>
            </p>
          )}

          <p className="text-white/35 text-sm">Sigue leyendo ✨</p>
        </div>
      </WrappedSlide>

      {isFullscreen && !isExporting && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-20 rounded-full bg-white/5 hover:bg-white/10 text-white/60 border border-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );

  const handleDownload = async () => {
    if (!containerRef.current) return;
    setIsDownloading(true);
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 300));

    try {
      if (!(window as any).html2canvas) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const h2c = (window as any).html2canvas;
      const canvas = await h2c(containerRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: 2,
        logging: false,
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const link = document.createElement("a");
      link.download = `wrapped-${selectedYear}-slide${currentSlide + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
      setIsDownloading(false);
    }
  };

  if (yearBooks.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> Tu Wrapped
          </h2>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <BookOpen className="h-10 w-10 text-emerald-500/40" />
          </div>
          <p className="text-xl font-display text-muted-foreground">
            No hay libros terminados en {selectedYear}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            ¡Empieza a leer para generar tu resumen!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> Wrapped {selectedYear}
          </h2>

          <Select
            value={String(selectedYear)}
            onValueChange={(v) => {
              setSelectedYear(Number(v));
              setCurrentSlide(0);
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(true)}
          >
            Pantalla completa
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            <ImageDown className="h-4 w-4" />
            {isDownloading ? "Guardando..." : "Guardar imagen"}
          </Button>
        </div>
      </div>

      {wrappedContent}

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          disabled={currentSlide === 0}
          className="rounded-full h-10 w-10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 border border-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentSlide
                  ? "w-6 bg-emerald-400"
                  : i < currentSlide
                  ? "w-1.5 bg-white/30"
                  : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          disabled={currentSlide === totalSlides - 1}
          className="rounded-full h-10 w-10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 border border-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {currentSlide < totalSlides - 1 && (
        <p className="text-center text-xs text-muted-foreground/40 font-body">
          Desliza o usa ← → para navegar
        </p>
      )}
    </div>
  );
}
