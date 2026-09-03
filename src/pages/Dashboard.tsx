import { useState, useMemo, useRef } from "react";
import { GENRE_COLORS } from "@/lib/constants";
import { useBooksContext } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingUp, TrendingDown, User, Library, ChartBar as BarChart3, Clock, CalendarRange, Star, Flame, BookMarked, Target, Pencil, Check } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { ShareableStats, BestOfYearExport } from "@/components/ShareableStats";
import { getBookYear, getBookMonth, parseFlexibleDate } from "@/lib/dateUtils";
import { useReadingHabits } from "@/hooks/useReadingHabits";

const GOALS_KEY = "book-tracker-reading-goals";
function loadGoals(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}"); } catch { return {}; }
}
function saveGoals(goals: Record<number, number>) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// --- Section header component ---
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-display font-bold text-lg">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// --- KPI Card ---
function KpiCard({ value, label, icon: Icon, tone = "teal" }: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  tone?: "teal" | "gold" | "violet" | "coral";
}) {
  const tones = {
    teal: "from-primary/18 via-primary/5 to-transparent text-primary",
    gold: "from-amber-400/18 via-amber-400/5 to-transparent text-amber-300",
    violet: "from-violet-500/18 via-violet-500/5 to-transparent text-violet-300",
    coral: "from-rose-400/18 via-rose-400/5 to-transparent text-rose-300",
  };
  return (
    <Card className={`group relative overflow-hidden rounded-2xl border-border/30 bg-gradient-to-br ${tones[tone]} transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_14px_30px_rgba(0,0,0,0.16)]`}>
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-current opacity-10 blur-2xl" />
      <CardContent className="relative p-6">
        <div className="mb-5 flex items-start justify-between"><div className="rounded-xl border border-current/20 bg-background/30 p-2.5"><Icon className="h-4 w-4" /></div></div>
        <p className="text-3xl font-bold font-display text-foreground tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-xs text-muted-foreground mt-1 font-body">{label}</p>
      </CardContent>
    </Card>
  );
}

// --- Book highlight card ---
function BookHighlight({ book, label, metric, icon: Icon }: {
  book: { title: string; author: string; coverUrl?: string; totalPages: number; rating: number };
  label: string;
  metric: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
      <BookCoverImage
        src={book.coverUrl}
        alt={book.title}
        title={book.title}
        className="w-14 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
        fallbackClassName="w-14 h-20 rounded-lg flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-primary/60" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        </div>
        <p className="font-display font-semibold text-sm truncate">{book.title}</p>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        <p className="text-xs text-primary font-semibold mt-0.5">{metric}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { books } = useBooksContext();
  const { habits } = useReadingHabits();

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(new Date().getFullYear());
    books.forEach((b) => yearSet.add(getBookYear(b)));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [books]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [goals, setGoals] = useState<Record<number, number>>(loadGoals);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const goalInputRef = useRef<HTMLInputElement>(null);

  const currentGoal = goals[selectedYear] ?? 0;

  const handleGoalSave = () => {
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val >= 0) {
      const updated = { ...goals, [selectedYear]: val };
      setGoals(updated);
      saveGoals(updated);
    }
    setEditingGoal(false);
  };

  const handleGoalEdit = () => {
    setGoalInput(String(currentGoal || ""));
    setEditingGoal(true);
    setTimeout(() => goalInputRef.current?.focus(), 0);
  };

  const yearBooks = useMemo(
    () => books.filter((b) => b.status === "finished" && getBookYear(b) === selectedYear),
    [books, selectedYear]
  );

  const totalPages = useMemo(() => yearBooks.reduce((s, b) => s + b.totalPages, 0), [yearBooks]);

  const avgPagesPerBook = useMemo(() => {
    return yearBooks.length > 0 ? Math.round(totalPages / yearBooks.length) : 0;
  }, [yearBooks, totalPages]);

  // Racha de lectura: se calcula a partir de los mismos datos que la
  // página de Hábitos (Supabase, vía useReadingHabits), en lugar de leer
  // una copia local en localStorage que nunca se actualizaba y hacía que
  // el Dashboard mostrara "0 días" aunque hubiera una racha activa.
  const streak = useMemo(() => {
    const allDays = Object.values(habits).flat().sort().reverse();
    if (allDays.length === 0) return 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (!allDays.includes(todayStr) && !allDays.includes(yesterdayStr)) return 0;
    const startDate = allDays.includes(todayStr) ? today : yesterday;
    let count = 0;
    const d = new Date(startDate);
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (allDays.includes(key)) { count++; d.setDate(d.getDate() - 1); } else break;
    }
    return count;
  }, [habits]);

  const mostPages = useMemo(() => {
    if (yearBooks.length === 0) return null;
    return yearBooks.reduce((max, b) => (b.totalPages > max.totalPages ? b : max), yearBooks[0]);
  }, [yearBooks]);

  const leastPages = useMemo(() => {
    if (yearBooks.length === 0) return null;
    return yearBooks.filter(b => b.totalPages > 0).reduce((min, b) => (b.totalPages < min.totalPages ? b : min), yearBooks[0]);
  }, [yearBooks]);

  const topRatedBook = useMemo(() => {
    const rated = yearBooks.filter(b => b.rating > 0).sort((a, b) => b.rating - a.rating);
    return rated[0] || null;
  }, [yearBooks]);

  const authorStats = useMemo(() => {
    const map: Record<string, { titles: string[]; totalRating: number; ratedCount: number }> = {};
    yearBooks.forEach((b) => {
      if (!map[b.author]) map[b.author] = { titles: [], totalRating: 0, ratedCount: 0 };
      map[b.author].titles.push(b.title);
      if (b.rating > 0) { map[b.author].totalRating += b.rating; map[b.author].ratedCount++; }
    });
    return Object.entries(map)
      .map(([author, data]) => ({ author, titles: data.titles, count: data.titles.length, avgRating: data.ratedCount > 0 ? (data.totalRating / data.ratedCount) : null }))
      .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author));
  }, [yearBooks]);

  const sagaData = useMemo(() => {
    const map: Record<string, string[]> = {};
    yearBooks.filter(b => b.hasSaga && b.saga).forEach((b) => { if (!map[b.saga!]) map[b.saga!] = []; map[b.saga!].push(b.title); });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [yearBooks]);

  const genreData = useMemo(() => {
    const map: Record<string, number> = {};
    yearBooks.forEach((b) => { const g = b.genre || "Sin género"; map[g] = (map[g] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [yearBooks]);

  const genreColorMap: Record<string, string> = Object.fromEntries(
    Object.entries(GENRE_COLORS).map(([genre, cls]) => {
      const match = cls.match(/bg-\[hsl\(([^)]+)\)\]/);
      return [genre, match ? `hsl(${match[1]})` : "hsl(28,56%,36%)"];
    })
  );
  const FALLBACK_COLORS = ["hsl(28,56%,36%)", "hsl(38,72%,50%)", "hsl(142,52%,36%)", "hsl(270,50%,50%)"];

  const readingTimeStats = useMemo(() => {
    const booksWithDates = yearBooks.filter(b => b.startDate && b.endDate);
    if (booksWithDates.length === 0) return null;
    const times = booksWithDates.map(b => {
      const start = parseFlexibleDate(b.startDate!) ?? new Date(b.startDate!);
      const end = parseFlexibleDate(b.endDate!) ?? new Date(b.endDate!);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    });
    const avg = times.reduce((s, t) => s + t, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    const fastestBook = booksWithDates[times.indexOf(fastest)];
    const slowestBook = booksWithDates[times.indexOf(slowest)];
    return { avg: avg.toFixed(0), fastest, slowest, fastestBook, slowestBook, count: booksWithDates.length };
  }, [yearBooks]);

  // Monthly books bar chart data
  const monthlyBarData = useMemo(() => {
    return MONTH_SHORT.map((month, i) => ({
      month,
      libros: yearBooks.filter(b => getBookMonth(b) === i).length,
    }));
  }, [yearBooks]);

  // Evolution line chart (multi-year)
  const evolutionData = useMemo(() => {
    const finishedBooks = books.filter(b => b.status === "finished");
    const yearsInData = new Set<number>();
    finishedBooks.forEach(b => yearsInData.add(getBookYear(b)));
    const sortedYears = Array.from(yearsInData).sort();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return MONTH_SHORT.map((month, i) => {
      const row: Record<string, string | number | null> = { month };
      sortedYears.forEach(y => {
        // No dibujar meses futuros del año en curso: antes se rellenaban
        // con 0 (sin libros), lo que Recharts conectaba con el resto de
        // la línea y daba la falsa impresión de que ya había datos para
        // meses que todavía no han pasado.
        if (y === currentYear && i > currentMonth) {
          row[String(y)] = null;
        } else {
          row[String(y)] = finishedBooks.filter(b => getBookYear(b) === y && getBookMonth(b) === i).length;
        }
      });
      return row;
    });
  }, [books]);

  const evolutionYears = useMemo(() => {
    const finishedBooks = books.filter(b => b.status === "finished");
    const yearsInData = new Set<number>();
    finishedBooks.forEach(b => yearsInData.add(getBookYear(b)));
    return Array.from(yearsInData).sort();
  }, [books]);

  const LINE_COLORS = ["hsl(28,56%,36%)", "hsl(38,72%,50%)", "hsl(142,52%,36%)", "hsl(340,65%,55%)", "hsl(270,50%,50%)"];

  const avgRating = useMemo(() => {
    const rated = yearBooks.filter(b => b.rating > 0);
    return rated.length > 0 ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0;
  }, [yearBooks]);
  const goalProgress = currentGoal > 0 ? Math.min(100, Math.round((yearBooks.length / currentGoal) * 100)) : 0;
  const booksRemaining = Math.max(0, currentGoal - yearBooks.length);
  const monthlyStoryData = useMemo(() => MONTH_SHORT.map((month, index) => {
    const monthBooks = yearBooks.filter((book) => getBookMonth(book) === index);
    return { month, books: monthBooks, count: monthBooks.length };
  }), [yearBooks]);
  const topGenre = genreData[0];

  return (
    <div className="space-y-12 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card px-5 py-7 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><TrendingUp className="h-3.5 w-3.5" /> Tu año lector</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Dashboard</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Tu ritmo, tus historias y todos los detalles que han dado forma a {selectedYear}.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}><SelectTrigger aria-label="Seleccionar año" className="h-11 w-28 border-border/50 bg-background/60"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>{yearBooks.length > 0 && <><ShareableStats year={selectedYear} books={yearBooks} /><BestOfYearExport year={selectedYear} books={yearBooks} /></>}</div>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-3 border-t border-border/40 pt-5 sm:max-w-2xl"><div><p className="font-display text-2xl font-semibold">{yearBooks.length}</p><p className="text-xs text-muted-foreground">libros leídos</p></div><div><p className="font-display text-2xl font-semibold">{totalPages.toLocaleString()}</p><p className="text-xs text-muted-foreground">páginas vividas</p></div><div><p className="font-display text-2xl font-semibold text-primary">{avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"}</p><p className="text-xs text-muted-foreground">valoración media</p></div></div>
      </section>

      {/* ═══ OBJETIVO ANUAL ═══ */}
      <Card className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-r from-primary/12 via-card to-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/15 p-2.5">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold font-body">Objetivo de lectura {selectedYear}</p>
                {currentGoal > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {yearBooks.length} de {currentGoal} libros
                    {yearBooks.length >= currentGoal && <span className="text-emerald-500 ml-1 font-medium">Completado!</span>}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin objetivo definido</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingGoal ? (
                <>
                  <input
                    ref={goalInputRef}
                    type="number"
                    min={0}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleGoalSave(); if (e.key === "Escape") setEditingGoal(false); }}
                    className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0"
                  />
                  <button onClick={handleGoalSave} className="h-9 rounded-lg bg-primary px-2 text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Check className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoalEdit}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {currentGoal > 0 ? "Editar objetivo" : "Fijar objetivo"}
                </button>
              )}
            </div>
          </div>

          {currentGoal > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{Math.round((yearBooks.length / currentGoal) * 100)}%</span>
                <span>{Math.max(0, currentGoal - yearBooks.length)} por leer</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-background/60">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (yearBooks.length / currentGoal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {yearBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <BookOpen className="h-9 w-9 text-primary/40" />
          </div>
          <p className="text-lg text-muted-foreground font-display">No hay libros terminados en {selectedYear}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Añade libros y márcalos como terminados para ver tus estadísticas</p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════
              SECCIÓN 1: KPIs GRANDES
              ═══════════════════════════════════════════ */}
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard value={authorStats.length} label="Autores explorados" icon={User} tone="violet" />
              <KpiCard value={genreData.length} label="Géneros leídos" icon={Library} tone="gold" />
              <KpiCard value={avgPagesPerBook} label="Páginas de media / libro" icon={BarChart3} tone="teal" />
              <KpiCard
                value={readingTimeStats ? `${readingTimeStats.avg} días` : `${streak} días`}
                label={readingTimeStats ? "Media de lectura / libro" : "Racha de lectura"}
                icon={readingTimeStats ? Clock : Flame}
                tone="coral"
              />
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECCIÓN 2: GRÁFICOS
              ═══════════════════════════════════════════ */}
          <section className="space-y-6">
          <section className="space-y-6">
            <SectionHeader icon={TrendingUp} title="El ritmo de tu año" subtitle="Tus meses de lectura, convertidos en una pequeña historia visual" />
            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
              <div className="rounded-3xl border border-border/40 bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-end justify-between"><div><p className="font-display text-xl font-semibold">Mes a mes</p><p className="text-xs text-muted-foreground">Cada portada marca un capítulo terminado.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{yearBooks.length} historias</span></div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {monthlyStoryData.map(({ month, books: monthBooks, count }) => <div key={month} className={`min-h-[132px] rounded-2xl border p-2 transition-transform hover:-translate-y-1 ${count > 0 ? "border-primary/20 bg-primary/[0.07]" : "border-border/25 bg-muted/15"}`}><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{month}</span><span className={`font-display text-lg font-semibold ${count > 0 ? "text-primary" : "text-muted-foreground/35"}`}>{count}</span></div><div className="mt-3 flex h-[82px] items-end gap-1 overflow-hidden">{monthBooks.slice(0, 3).map((book) => <BookCoverImage key={book.id} src={book.coverUrl} alt={book.title} title={book.title} className="h-[72px] min-w-0 flex-1 rounded-md object-cover shadow-md" fallbackClassName="h-[72px] min-w-0 flex-1 rounded-md bg-primary/15" iconClassName="h-3 w-3" />)}{count > 3 && <span className="self-end rounded-md bg-background/70 px-1.5 py-1 text-[10px] text-primary">+{count - 3}</span>}{count === 0 && <span className="mb-1 text-[10px] text-muted-foreground/35">En pausa</span>}</div></div>)}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-400/15 via-violet-500/10 to-card p-6"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-rose-400/20 blur-3xl" /><div className="relative"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300">Tu universo favorito</p><p className="mt-4 font-display text-3xl font-semibold leading-tight">{topGenre?.name || "Aún por descubrir"}</p><p className="mt-2 text-sm text-muted-foreground">{topGenre ? `${topGenre.value} de ${yearBooks.length} libros este año` : "Termina un libro para verlo aquí."}</p>{topGenre && <div className="mt-6 h-2 overflow-hidden rounded-full bg-background/50"><div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.round((topGenre.value / yearBooks.length) * 100)}%` }} /></div>}<div className="mt-6 space-y-2">{genreData.slice(0, 4).map((genre, index) => <div key={genre.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: genreColorMap[genre.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length] }} />{genre.name}</span><span className="font-semibold text-foreground">{genre.value}</span></div>)}</div></div></div>
            </div>
          </section>

          <section className="hidden space-y-6">
            <SectionHeader icon={BarChart3} title="Gráficos" subtitle={`Visualización de tu lectura en ${selectedYear}`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Libros por mes (bar chart) */}
              <Card className="border-border/30">
                <CardContent className="pt-6 pb-4">
                  <p className="text-sm font-semibold font-body text-foreground mb-4">Libros por mes</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyBarData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--foreground)" }} stroke="var(--muted-foreground)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--foreground)" }} stroke="var(--muted-foreground)" width={24} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          fontSize: "13px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--card)",
                        }}
                        formatter={(value: number) => [`${value} libros`, ""]}
                      />
                      <Bar dataKey="libros" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Géneros (pie) */}
              {genreData.length > 0 && (
                <Card className="border-border/30">
                  <CardContent className="pt-6 pb-4">
                    <p className="text-sm font-semibold font-body text-foreground mb-4">Distribución por género</p>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="55%" height={220}>
                        <PieChart>
                          <Pie
                            data={genreData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            innerRadius={45}
                            paddingAngle={2}
                            strokeWidth={0}
                          >
                            {genreData.map((entry, i) => (
                              <Cell key={i} fill={genreColorMap[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: "10px",
                              fontSize: "12px",
                              border: "1px solid var(--border)",
                              backgroundColor: "var(--card)",
                            }}
                            formatter={(value: number) => [`${value} libros`, ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5">
                        {genreData.slice(0, 6).map((g, i) => (
                          <div key={g.name} className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: genreColorMap[g.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                            />
                            <span className="text-xs text-foreground truncate flex-1">{g.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{g.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Evolution line chart */}
            {evolutionYears.length > 0 && (
              <Card className="border-border/30">
                <CardContent className="pt-6 pb-4">
                  <p className="text-sm font-semibold font-body text-foreground mb-4">Evolución mes a mes</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--foreground)" }} stroke="var(--muted-foreground)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--foreground)" }} stroke="var(--muted-foreground)" width={24} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          fontSize: "13px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--card)",
                        }}
                      />
                      {evolutionYears.length > 1 && (
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      )}
                      {evolutionYears.map((year, i) => (
                        <Line
                          key={year}
                          type="monotone"
                          dataKey={String(year)}
                          stroke={LINE_COLORS[i % LINE_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                          name={String(year)}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </section>

          {/* ═══════════════════════════════════════════
              SECCIÓN 3: DETALLE
              ═══════════════════════════════════════════ */}
          <section className="space-y-6">
            <SectionHeader icon={BookOpen} title="Detalles" subtitle="Autores, sagas y libros destacados" />

            {/* Highlighted books */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRatedBook && (
                <BookHighlight
                  book={topRatedBook}
                  label="Mejor valorado"
                  metric={`${topRatedBook.rating} ★`}
                  icon={Star}
                />
              )}
              {mostPages && (
                <BookHighlight
                  book={mostPages}
                  label="Más páginas"
                  metric={`${mostPages.totalPages.toLocaleString()} pág.`}
                  icon={TrendingUp}
                />
              )}
              {leastPages && leastPages.id !== mostPages?.id && (
                <BookHighlight
                  book={leastPages}
                  label="Menos páginas"
                  metric={`${leastPages.totalPages.toLocaleString()} pág.`}
                  icon={TrendingDown}
                />
              )}
            </div>

            {/* Reading speed */}
            {readingTimeStats && (
              <Card className="border-border/30">
                <CardContent className="pt-6">
                  <p className="text-sm font-semibold font-body text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary/60" />
                    Velocidad de lectura
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl font-bold text-foreground font-display">{readingTimeStats.avg}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Días/libro (media)</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl font-bold text-foreground font-display">{readingTimeStats.fastest}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Más rápido</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{readingTimeStats.fastestBook.title}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-2xl font-bold text-foreground font-display">{readingTimeStats.slowest}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Más lento</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{readingTimeStats.slowestBook.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Authors & Sagas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {authorStats.length > 0 && (
                <Card className="border-border/30">
                  <CardContent className="pt-6">
                    <p className="text-sm font-semibold font-body text-foreground mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary/60" />
                      Autores leídos
                      <span className="text-xs text-muted-foreground font-normal">({authorStats.length})</span>
                    </p>
                    <div className="space-y-4">
                      {authorStats.map(({ author, titles, count, avgRating: authorAvg }) => (
                        <div key={author} className="p-3 rounded-lg bg-muted/20 border border-border/15">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm font-display">{author}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{count} {count === 1 ? "libro" : "libros"}</span>
                              {authorAvg !== null && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                  <Star className="h-3 w-3 fill-amber-500" />
                                  {authorAvg.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {titles.map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {sagaData.length > 0 && (
                <Card className="border-border/30">
                  <CardContent className="pt-6">
                    <p className="text-sm font-semibold font-body text-foreground mb-4 flex items-center gap-2">
                      <Library className="h-4 w-4 text-primary/60" />
                      Sagas leídas
                      <span className="text-xs text-muted-foreground font-normal">({sagaData.length})</span>
                    </p>
                    <div className="space-y-4">
                      {sagaData.map(([saga, titles]) => (
                        <div key={saga} className="p-3 rounded-lg bg-muted/20 border border-border/15">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm font-display">{saga}</p>
                            <span className="text-xs text-muted-foreground">{titles.length} {titles.length === 1 ? "libro" : "libros"}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {titles.map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Book covers gallery */}
            <Card className="border-border/30">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold font-body text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary/60" />
                  Portadas de {selectedYear}
                  <span className="text-xs text-muted-foreground font-normal">({yearBooks.length} libros)</span>
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {yearBooks.map((book) => (
                    <div key={book.id} className="group relative">
                      <BookCoverImage
                        src={book.coverUrl}
                        alt={book.title}
                        title={book.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                        fallbackClassName="w-full aspect-[2/3] rounded-lg"
                      />
                      <div className="absolute inset-0 bg-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-end p-1.5">
                        <p className="text-background text-[10px] leading-tight font-medium line-clamp-3">{book.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
