import { useState, useMemo, useRef } from "react";
import { GENRE_COLORS } from "@/lib/constants";
import { useBooksContext } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingUp, TrendingDown, User, Library, ChartBar as BarChart3, Clock, CalendarRange, Star, Flame, BookMarked, Target, Pencil, Check } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid,
} from "recharts";
import { ShareableStats, BestOfYearExport } from "@/components/ShareableStats";

function getYearFromBook(book: { endDate?: string; startDate?: string; addedAt: string }): number {
  const dateStr = book.endDate || book.startDate || book.addedAt;
  if (!dateStr) return new Date().getFullYear();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

const HABITS_KEY = "book-tracker-reading-habits";
function loadHabits(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(HABITS_KEY) || "{}"); } catch { return {}; }
}

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
function KpiCard({ value, label, icon: Icon, accent = false }: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card className="border-border/30 hover:border-border/60 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${accent ? "bg-accent/10" : "bg-primary/8"}`}>
            <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-primary/70"}`} />
          </div>
        </div>
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

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(new Date().getFullYear());
    books.forEach((b) => yearSet.add(getYearFromBook(b)));
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
    () => books.filter((b) => b.status === "finished" && getYearFromBook(b) === selectedYear),
    [books, selectedYear]
  );

  const totalPages = useMemo(() => yearBooks.reduce((s, b) => s + b.totalPages, 0), [yearBooks]);

  const avgPagesPerBook = useMemo(() => {
    return yearBooks.length > 0 ? Math.round(totalPages / yearBooks.length) : 0;
  }, [yearBooks, totalPages]);

  const streak = useMemo(() => {
    const habits = loadHabits();
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
  }, []);

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
      const start = new Date(b.startDate!);
      const end = new Date(b.endDate!);
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
      libros: yearBooks.filter(b => new Date(b.endDate || b.startDate || b.addedAt).getMonth() === i).length,
    }));
  }, [yearBooks]);

  // Evolution line chart (multi-year)
  const evolutionData = useMemo(() => {
    const finishedBooks = books.filter(b => b.status === "finished");
    const yearsInData = new Set<number>();
    finishedBooks.forEach(b => { const y = new Date(b.endDate || b.startDate || b.addedAt).getFullYear(); if (!isNaN(y)) yearsInData.add(y); });
    const sortedYears = Array.from(yearsInData).sort();
    return MONTH_SHORT.map((month, i) => {
      const row: Record<string, string | number> = { month };
      sortedYears.forEach(y => { row[String(y)] = finishedBooks.filter(b => { const d = new Date(b.endDate || b.startDate || b.addedAt); return d.getFullYear() === y && d.getMonth() === i; }).length; });
      return row;
    });
  }, [books]);

  const evolutionYears = useMemo(() => {
    const finishedBooks = books.filter(b => b.status === "finished");
    const yearsInData = new Set<number>();
    finishedBooks.forEach(b => { const y = new Date(b.endDate || b.startDate || b.addedAt).getFullYear(); if (!isNaN(y)) yearsInData.add(y); });
    return Array.from(yearsInData).sort();
  }, [books]);

  const LINE_COLORS = ["hsl(28,56%,36%)", "hsl(38,72%,50%)", "hsl(142,52%,36%)", "hsl(340,65%,55%)", "hsl(270,50%,50%)"];

  const avgRating = useMemo(() => {
    const rated = yearBooks.filter(b => b.rating > 0);
    return rated.length > 0 ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0;
  }, [yearBooks]);

  return (
    <div className="space-y-12">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-display">📊 Dashboard</h2>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {yearBooks.length > 0 && (
          <div className="flex items-center gap-2">
            <ShareableStats year={selectedYear} books={yearBooks} />
            <BestOfYearExport year={selectedYear} books={yearBooks} />
          </div>
        )}
      </div>

      {/* ═══ OBJETIVO ANUAL ═══ */}
      <Card className="border-border/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
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
                    className="w-20 h-8 text-sm px-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0"
                  />
                  <button onClick={handleGoalSave} className="h-8 px-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Check className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoalEdit}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
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
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
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
              <KpiCard value={yearBooks.length} label="Libros leídos" icon={BookOpen} />
              <KpiCard value={totalPages.toLocaleString()} label="Páginas totales" icon={BookMarked} accent />
              <KpiCard value={avgPagesPerBook} label="Páginas de media / libro" icon={BarChart3} />
              <KpiCard
                value={readingTimeStats ? `${readingTimeStats.avg} días` : `${streak} días`}
                label={readingTimeStats ? "Media de lectura / libro" : "Racha de lectura"}
                icon={readingTimeStats ? Clock : Flame}
                accent
              />
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: "Autores", value: new Set(yearBooks.map(b => b.author)).size },
                { label: "Géneros", value: new Set(yearBooks.filter(b => b.genre).map(b => b.genre)).size },
                { label: "Racha", value: `${streak} días`, show: !!readingTimeStats },
                { label: "Valoración media", value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—" },
              ].filter(s => s.show !== false).map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/40 border border-border/20">
                  <p className="text-lg font-bold font-display text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECCIÓN 2: GRÁFICOS
              ═══════════════════════════════════════════ */}
          <section className="space-y-6">
            <SectionHeader icon={BarChart3} title="Gráficos" subtitle={`Visualización de tu lectura en ${selectedYear}`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Libros por mes (bar chart) */}
              <Card className="border-border/30">
                <CardContent className="pt-6 pb-4">
                  <p className="text-sm font-semibold font-body text-foreground mb-4">Libros por mes</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyBarData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.75)" }} stroke="rgba(0,0,0,0.15)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(0,0,0,0.75)" }} stroke="rgba(0,0,0,0.15)" width={24} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          fontSize: "13px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))",
                        }}
                        formatter={(value: number) => [`${value} libros`, ""]}
                      />
                      <Bar dataKey="libros" fill="#7DD3FC" radius={[6, 6, 0, 0]} />
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
                              border: "1px solid hsl(var(--border))",
                              backgroundColor: "hsl(var(--card))",
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
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(0,0,0,0.75)" }} stroke="rgba(0,0,0,0.15)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "rgba(0,0,0,0.75)" }} stroke="rgba(0,0,0,0.15)" width={24} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          fontSize: "13px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))",
                        }}
                      />
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
