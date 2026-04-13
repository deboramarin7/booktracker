import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useBooksContext } from "@/components/Layout";
import { BookCoverImage } from "@/components/BookCoverImage";
import { BookOpen, Star, TrendingUp, Heart, ChevronRight, Sparkles } from "lucide-react";

function getSpineColor(title: string): string {
  const colors = [
    "#7c3aed","#0f766e","#b91c1c","#b45309",
    "#1d4ed8","#be185d","#15803d","#7e22ce",
    "#c2410c","#0e7490",
  ];
  const idx = (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % colors.length;
  return colors[idx];
}

function getSpineTextColor(title: string): string {
  const colors = ["#ede9fe","#ccfbf1","#fee2e2","#fef3c7","#dbeafe","#fce7f3","#dcfce7","#f3e8ff","#ffedd5","#cffafe"];
  const idx = (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % colors.length;
  return colors[idx];
}

function MiniSpine({ book }: { book: { id: string; title: string; coverUrl?: string; rating?: number } }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const spineColor = getSpineColor(book.title);
  const spineTextColor = getSpineTextColor(book.title);

  return (
    <div
      className="relative shrink-0 transition-all duration-300 hover:-translate-y-4 hover:z-20 cursor-pointer group"
      style={{ width: "42px", height: "130px" }}
    >
      {book.coverUrl && !coverFailed ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          onError={() => setCoverFailed(true)}
          className="w-full h-full object-cover rounded-sm shadow-md group-hover:shadow-xl"
          style={{ filter: "brightness(0.92) contrast(1.05)" }}
        />
      ) : (
        <div
          className="w-full h-full rounded-sm shadow-md flex items-end justify-center pb-2"
          style={{ backgroundColor: spineColor }}
        >
          <div className="absolute top-[4px] left-[3px] right-[3px] h-[1px] opacity-40" style={{ backgroundColor: spineTextColor }} />
          <div className="absolute bottom-[4px] left-[3px] right-[3px] h-[1px] opacity-40" style={{ backgroundColor: spineTextColor }} />
          <span
            className="text-[9px] font-display font-bold leading-tight text-center px-0.5 truncate"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed", color: spineTextColor, maxHeight: "90%", fontSize: "8px" }}
          >
            {book.title}
          </span>
        </div>
      )}
      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-display px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 max-w-[120px] text-center truncate">
        {book.title}
      </div>
    </div>
  );
}

function ShelfRow({ books }: { books: { id: string; title: string; coverUrl?: string; rating?: number }[] }) {
  return (
    <div className="relative">
      {/* Books */}
      <div className="flex items-end gap-[3px] px-4 pb-0">
        {books.map((book) => (
          <MiniSpine key={book.id} book={book} />
        ))}
        {/* Fill empty space */}
        {books.length < 18 && Array.from({ length: Math.max(0, 18 - books.length) }).map((_, i) => (
          <div key={i} className="shrink-0" style={{ width: "42px", height: "130px" }} />
        ))}
      </div>
      {/* Shelf plank */}
      <div className="h-4 rounded-sm shadow-lg mx-1" style={{
        background: "linear-gradient(180deg, #8B6914 0%, #6B4F10 40%, #4A3208 100%)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
      }} />
    </div>
  );
}

export default function Home() {
  const { books, loading } = useBooksContext();

  const finished = useMemo(() => books.filter(b => b.status === "finished"), [books]);
  const reading = useMemo(() => books.filter(b => b.status === "reading"), [books]);

  const currentYear = new Date().getFullYear();
  const thisYear = useMemo(() =>
    finished.filter(b => {
      const d = new Date(b.endDate || b.startDate || b.addedAt);
      return d.getFullYear() === currentYear;
    }), [finished, currentYear]);

  const totalPages = useMemo(() => finished.reduce((s, b) => s + (b.totalPages || 0), 0), [finished]);
  const avgRating = useMemo(() => {
    const rated = finished.filter(b => b.rating > 0);
    return rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : "—";
  }, [finished]);

  // Split books into shelves of ~17
  const PER_SHELF = 17;
  const shelves = useMemo(() => {
    const rows = [];
    for (let i = 0; i < finished.length; i += PER_SHELF) {
      rows.push(finished.slice(i, i + PER_SHELF));
    }
    return rows;
  }, [finished]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground font-display animate-pulse">Cargando tu biblioteca...</div>
      </div>
    );
  }

  return (
    <div className="space-y-0 -mt-4 md:-mt-8">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl mb-8" style={{
        background: "linear-gradient(135deg, hsl(220,25%,8%) 0%, hsl(220,20%,11%) 50%, hsl(142,30%,10%) 100%)",
        minHeight: "420px",
      }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, hsl(142,50%,45%), transparent)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl" style={{ background: "radial-gradient(circle, hsl(260,50%,55%), transparent)" }} />
        </div>

        {/* Header text */}
        <div className="relative z-10 pt-10 pb-4 px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary opacity-70" />
            <span className="text-xs text-muted-foreground font-display uppercase tracking-widest">Tu biblioteca personal</span>
            <Sparkles className="h-4 w-4 text-primary opacity-70" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground mb-1">
            {finished.length > 0 ? `${finished.length} libros leídos` : "Tu estantería te espera"}
          </h2>
          <p className="text-muted-foreground font-display text-sm">
            {finished.length > 0
              ? `${thisYear.length} este año · ${totalPages.toLocaleString()} páginas · ⭐ ${avgRating}`
              : "Empieza a registrar tus lecturas"
            }
          </p>
        </div>

        {/* Bookshelves */}
        <div className="relative z-10 px-2 pb-6 space-y-3 overflow-hidden">
          {finished.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground font-display text-sm">
              Cuando marques libros como terminados aparecerán aquí ✨
            </div>
          ) : (
            shelves.slice(0, 3).map((row, i) => (
              <ShelfRow key={i} books={row} />
            ))
          )}
          {/* Fade out at bottom if more shelves */}
          {shelves.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{
              background: "linear-gradient(transparent, hsl(220,25%,8%))"
            }} />
          )}
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: <BookOpen className="h-5 w-5" />, value: finished.length, label: "Terminados", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { icon: <TrendingUp className="h-5 w-5" />, value: thisYear.length, label: `Leídos en ${currentYear}`, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { icon: <Star className="h-5 w-5" />, value: avgRating, label: "Valoración media", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { icon: <Heart className="h-5 w-5" />, value: reading.length, label: "Leyendo ahora", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border p-4 flex flex-col gap-2 ${stat.bg}`}>
            <div className={stat.color}>{stat.icon}</div>
            <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground font-display">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to: "/biblioteca", icon: <BookOpen className="h-5 w-5" />, label: "Mi Biblioteca", desc: "Ver todos tus libros", color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40" },
          { to: "/dashboard", icon: <TrendingUp className="h-5 w-5" />, label: "📊 Dashboard", desc: "Estadísticas de lectura", color: "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40" },
          { to: "/wrapped", icon: <Sparkles className="h-5 w-5" />, label: "Wrapped ✨", desc: "Tu resumen del año", color: "from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40" },
        ].map((item, i) => (
          <Link
            key={i}
            to={item.to}
            className={`group rounded-2xl border bg-gradient-to-br p-4 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${item.color}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-foreground/70">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold font-display text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground font-display">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>

    </div>
  );
}
