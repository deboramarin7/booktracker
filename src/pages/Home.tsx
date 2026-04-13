import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useBooksContext } from "@/components/Layout";
import { BookOpen, Star, TrendingUp, Heart, ChevronRight, Sparkles } from "lucide-react";

function BookCover({ book }: { book: { id: string; title: string; coverUrl?: string } }) {
  const [failed, setFailed] = useState(false);
  const colors = ["#7c3aed","#0f766e","#b91c1c","#b45309","#1d4ed8","#be185d","#15803d","#7e22ce","#c2410c","#0e7490"];
  const color = colors[(book.title.charCodeAt(0) + book.title.charCodeAt(book.title.length - 1)) % colors.length];

  return (
    <div className="relative overflow-hidden rounded-md shadow-md" style={{ aspectRatio: "2/3" }}>
      {book.coverUrl && !failed ? (
        <img src={book.coverUrl} alt={book.title} onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-1" style={{ backgroundColor: color }}>
          <span className="text-white text-[8px] font-display text-center leading-tight line-clamp-4">{book.title}</span>
        </div>
      )}
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

  const avgRating = useMemo(() => {
    const rated = finished.filter(b => b.rating > 0);
    return rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : "—";
  }, [finished]);

  const heroBooks = useMemo(() => finished.slice(0, 30), [finished]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground font-display animate-pulse">Cargando tu biblioteca...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 -mt-4 md:-mt-8">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl" style={{
        background: "linear-gradient(135deg, hsl(220,25%,7%) 0%, hsl(220,20%,10%) 50%, hsl(142,25%,9%) 100%)",
        minHeight: "380px",
      }}>
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, hsl(142,50%,45%), transparent)" }} />
          <div className="absolute -bottom-10 right-1/4 w-60 h-60 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, hsl(260,50%,55%), transparent)" }} />
        </div>

        {/* Cover grid as background */}
        {heroBooks.length > 0 && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="grid gap-1.5 p-3 opacity-40" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))" }}>
              {heroBooks.map(book => <BookCover key={book.id} book={book} />)}
            </div>
            <div className="absolute inset-0" style={{
              background: "linear-gradient(180deg, rgba(14,18,26,0.3) 0%, rgba(14,18,26,0.55) 40%, rgba(14,18,26,0.97) 100%)"
            }} />
          </div>
        )}

        {/* Hero text */}
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-10 pt-48 px-6 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary opacity-80" />
            <span className="text-xs text-muted-foreground font-display uppercase tracking-widest">Tu biblioteca personal</span>
            <Sparkles className="h-3.5 w-3.5 text-primary opacity-80" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-foreground mb-2">
            {finished.length > 0 ? `${finished.length} libros leídos` : "Bienvenida a Book Tracker"}
          </h2>
          <p className="text-muted-foreground font-display text-sm max-w-sm">
            {finished.length > 0 ? "Tu colección literaria personal" : "Empieza a registrar tus lecturas"}
          </p>
          <Link
            to="/biblioteca"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-semibold transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <BookOpen className="h-4 w-4" />
            Ver mi biblioteca
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          { to: "/biblioteca", icon: <BookOpen className="h-5 w-5" />, label: "📚 Mi Biblioteca", desc: "Ver todos tus libros", color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40" },
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
