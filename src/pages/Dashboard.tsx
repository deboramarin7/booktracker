import { useEffect, useState, useMemo, useRef } from "react";
import { GENRE_COLORS } from "@/lib/constants";
import { useBooksContext } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, TrendingUp, TrendingDown, User, Library, ChartBar as BarChart3, Clock, CalendarRange, Star, Flame, BookMarked, Target, Pencil, Check, Trophy } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { ShareableStats, BestOfYearExport } from "@/components/ShareableStats";
import { getBookYear, getBookMonth, parseFlexibleDate } from "@/lib/dateUtils";
import { useReadingHabits } from "@/hooks/useReadingHabits";
import type { Book } from "@/hooks/useBooks";

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

const BOOK_OF_YEAR_KEY = "book-tracker-book-of-year";

function BookOfYear({ year, books }: { year: number; books: Book[] }) {
  const [monthlyPicks, setMonthlyPicks] = useState<Record<string, string>>({});
  const [semifinalists, setSemifinalists] = useState<string[]>([]);
  const [finalists, setFinalists] = useState<string[]>([]);
  const [winnerId, setWinnerId] = useState("");

  useEffect(() => {
    try {
      const allSelections = JSON.parse(localStorage.getItem(BOOK_OF_YEAR_KEY) || "{}");
      const selection = allSelections[String(year)] || {};
      setMonthlyPicks(selection.monthlyPicks || {});
      setSemifinalists(selection.semifinalists || []);
      setFinalists(selection.finalists || []);
      setWinnerId(selection.winnerId || "");
    } catch {
      setMonthlyPicks({});
      setSemifinalists([]);
      setFinalists([]);
      setWinnerId("");
    }
  }, [year]);

  const saveSelection = (nextPicks: Record<string, string>, nextSemifinalists: string[], nextFinalists: string[], nextWinner: string) => {
    try {
      const allSelections = JSON.parse(localStorage.getItem(BOOK_OF_YEAR_KEY) || "{}");
      allSelections[String(year)] = { monthlyPicks: nextPicks, semifinalists: nextSemifinalists, finalists: nextFinalists, winnerId: nextWinner };
      localStorage.setItem(BOOK_OF_YEAR_KEY, JSON.stringify(allSelections));
    } catch {
      // Si el navegador no permite guardar localmente, la selección sigue viva durante esta sesión.
    }
  };

  const selectMonth = (month: number, bookId: string) => {
    const nextPicks = { ...monthlyPicks, [String(month)]: bookId };
    const nextNomineeIds = new Set(Object.values(nextPicks));
    const nextSemifinalists = semifinalists.filter((id) => nextNomineeIds.has(id));
    const nextFinalists = finalists.filter((id) => nextSemifinalists.includes(id));
    const nextWinner = nextFinalists.includes(winnerId) ? winnerId : "";
    setMonthlyPicks(nextPicks);
    setSemifinalists(nextSemifinalists);
    setFinalists(nextFinalists);
    setWinnerId(nextWinner);
    saveSelection(nextPicks, nextSemifinalists, nextFinalists, nextWinner);
  };

  const toggleSemifinalist = (id: string) => {
    const nextSemifinalists = semifinalists.includes(id)
      ? semifinalists.filter((item) => item !== id)
      : semifinalists.length < 4 ? [...semifinalists, id] : semifinalists;
    const nextFinalists = finalists.filter((item) => nextSemifinalists.includes(item));
    const nextWinner = nextFinalists.includes(winnerId) ? winnerId : "";
    setSemifinalists(nextSemifinalists); setFinalists(nextFinalists); setWinnerId(nextWinner);
    saveSelection(monthlyPicks, nextSemifinalists, nextFinalists, nextWinner);
  };

  const toggleFinalist = (id: string) => {
    const nextFinalists = finalists.includes(id)
      ? finalists.filter((item) => item !== id)
      : finalists.length < 2 ? [...finalists, id] : finalists;
    const nextWinner = nextFinalists.includes(winnerId) ? winnerId : "";
    setFinalists(nextFinalists); setWinnerId(nextWinner);
    saveSelection(monthlyPicks, semifinalists, nextFinalists, nextWinner);
  };

  const nominees = Array.from(new Set(Object.values(monthlyPicks)))
    .map((id) => books.find((book) => book.id === id))
    .filter((book): book is Book => Boolean(book));
  const semiBooks = semifinalists.map((id) => books.find((book) => book.id === id)).filter((book): book is Book => Boolean(book));
  const finalBooks = finalists.map((id) => books.find((book) => book.id === id)).filter((book): book is Book => Boolean(book));
  const winner = books.find((book) => book.id === winnerId);
  const pickedMonths = Object.values(monthlyPicks).filter(Boolean).length;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-300/[0.10] via-card to-primary/[0.08] p-5 sm:p-7">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">Tu historia favorita</p>
              <h3 className="mt-1 font-display text-2xl font-semibold">El libro del año</h3>
              <p className="mt-1 text-sm text-muted-foreground">Elige una lectura de cada mes y deja que tus finalistas se encuentren aquí.</p>
            </div>
          </div>
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">{pickedMonths}/12 meses</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {MONTH_SHORT.map((month, index) => {
            const monthBooks = books.filter((book) => getBookMonth(book) === index);
            const pickedBook = books.find((book) => book.id === monthlyPicks[String(index)]);
            return (
              <div key={month} className={`min-h-[102px] rounded-2xl border p-2.5 ${pickedBook ? "border-amber-400/30 bg-background/45" : "border-border/30 bg-muted/15"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{month}</p>
                {monthBooks.length > 0 ? (
                  <select
                    value={monthlyPicks[String(index)] || ""}
                    onChange={(event) => selectMonth(index, event.target.value)}
                    className="mt-2 w-full bg-transparent text-xs font-medium text-foreground outline-none"
                    aria-label={`Elegir lectura favorita de ${month}`}
                  >
                    <option value="">Elegir libro…</option>
                    {monthBooks.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                  </select>
                  <Select value={monthlyPicks[String(index)] || "none"} onValueChange={(value) => selectMonth(index, value === "none" ? "" : value)}>
                    <SelectTrigger className="mt-2 h-8 w-full border-0 bg-transparent px-0 text-xs font-medium shadow-none focus:ring-0">
                      <SelectValue placeholder="Elegir libro…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Elegir libro…</SelectItem>
                      {monthBooks.map((book) => <SelectItem key={book.id} value={book.id}>{book.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <p className="mt-3 text-xs text-muted-foreground/55">Sin lecturas</p>}
                {pickedBook && <div className="mt-2 flex items-center gap-2"><BookCoverImage src={pickedBook.coverUrl} alt="" title={pickedBook.title} className="h-9 w-6 rounded object-cover shadow-sm" fallbackClassName="h-9 w-6 rounded" /><p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{pickedBook.title}</p></div>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 border-t border-border/35 pt-5 lg:grid-cols-3">
          <div>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">1 · Semifinales</p><span className="text-xs text-amber-300">{semifinalists.length}/4</span></div>
            <p className="mt-1 text-xs text-muted-foreground">Elige tus cuatro favoritos del mes.</p>
            <div className="mt-3 space-y-2">
              {nominees.map((book) => {
                const selected = semifinalists.includes(book.id);
                const blocked = !selected && semifinalists.length >= 4;
                return <button type="button" key={book.id} disabled={blocked} onClick={() => toggleSemifinalist(book.id)} className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-all disabled:opacity-40 ${selected ? "border-primary bg-primary/10" : "border-border/35 bg-background/35 hover:border-primary/45"}`}><BookCoverImage src={book.coverUrl} alt="" title={book.title} className="h-10 w-7 shrink-0 rounded object-cover" fallbackClassName="h-10 w-7 shrink-0 rounded" /><span className="line-clamp-2 text-xs font-medium">{book.title}</span></button>;
              })}
              {nominees.length === 0 && <p className="rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">Tus elegidos mensuales aparecerán aquí.</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">2 · La final</p><span className="text-xs text-amber-300">{finalists.length}/2</span></div>
            <p className="mt-1 text-xs text-muted-foreground">De los cuatro, escoge los dos finalistas.</p>
            <div className="mt-3 space-y-2">
              {semiBooks.map((book) => {
                const selected = finalists.includes(book.id);
                const blocked = !selected && finalists.length >= 2;
                return <button type="button" key={book.id} disabled={blocked} onClick={() => toggleFinalist(book.id)} className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-all disabled:opacity-40 ${selected ? "border-violet-400 bg-violet-400/10" : "border-border/35 bg-background/35 hover:border-violet-400/45"}`}><BookCoverImage src={book.coverUrl} alt="" title={book.title} className="h-10 w-7 shrink-0 rounded object-cover" fallbackClassName="h-10 w-7 shrink-0 rounded" /><span className="line-clamp-2 text-xs font-medium">{book.title}</span></button>;
              })}
              {semiBooks.length === 0 && <p className="rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">Primero necesitas cuatro semifinalistas.</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">3 · Libro del año</p>{winner && <Trophy className="h-4 w-4 text-amber-300" />}</div>
            <p className="mt-1 text-xs text-muted-foreground">La elección definitiva entre tus dos finalistas.</p>
            <div className="mt-3 space-y-2">
              {finalBooks.map((book) => {
                const selected = winnerId === book.id;
                return <button type="button" key={book.id} onClick={() => { const nextWinner = selected ? "" : book.id; setWinnerId(nextWinner); saveSelection(monthlyPicks, semifinalists, finalists, nextWinner); }} className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-all ${selected ? "border-amber-400 bg-amber-400/15 shadow-md shadow-amber-400/10" : "border-border/35 bg-background/35 hover:border-amber-400/45"}`}><BookCoverImage src={book.coverUrl} alt="" title={book.title} className="h-12 w-8 shrink-0 rounded object-cover" fallbackClassName="h-12 w-8 shrink-0 rounded" /><span className="min-w-0"><span className="line-clamp-2 block text-xs font-semibold">{book.title}</span><span className={`mt-1 block text-[10px] ${selected ? "text-amber-300" : "text-muted-foreground"}`}>{selected ? "Tu libro del año" : "Elegir ganador"}</span></span></button>;
              })}
              {finalBooks.length === 0 && <p className="rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">Tus dos finalistas se enfrentarán aquí.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
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

  return (
    <div className="space-y-12">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
         <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            📈 Dashboard
          </h2>

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

          {/* ═══ SECCIÓN 2: EL RITMO DE TU AÑO ═══ */}
          <section className="space-y-6">
            <SectionHeader icon={TrendingUp} title="El ritmo de tu año" subtitle="Cada portada es un capítulo que ya has vivido." />

            <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
              <div className="rounded-3xl border border-border/40 bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-semibold">Tu historia, mes a mes</p>
                    <p className="mt-1 text-xs text-muted-foreground">Portadas y pequeños hitos en lugar de gráficos impersonales.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{yearBooks.length} lecturas</span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {MONTH_SHORT.map((month, monthIndex) => {
                    const monthBooks = yearBooks.filter((book) => getBookMonth(book) === monthIndex);
                    return (
                      <div key={month} className={`min-h-[132px] rounded-2xl border p-2 transition-transform duration-200 hover:-translate-y-1 ${monthBooks.length > 0 ? "border-primary/20 bg-primary/[0.07]" : "border-border/25 bg-muted/15"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{month}</span>
                          <span className={`font-display text-lg font-semibold ${monthBooks.length > 0 ? "text-primary" : "text-muted-foreground/35"}`}>{monthBooks.length}</span>
                        </div>
                        <div className="mt-3 flex h-[82px] items-end gap-1 overflow-hidden">
                          {monthBooks.slice(0, 3).map((book) => (
                            <BookCoverImage key={book.id} src={book.coverUrl} alt={book.title} title={book.title} className="h-[72px] min-w-0 flex-1 rounded-md object-cover shadow-md" fallbackClassName="h-[72px] min-w-0 flex-1 rounded-md bg-primary/15" iconClassName="h-3 w-3" />
                          ))}
                          {monthBooks.length > 3 && <span className="self-end rounded-md bg-background/70 px-1.5 py-1 text-[10px] text-primary">+{monthBooks.length - 3}</span>}
                          {monthBooks.length === 0 && <span className="mb-1 text-[10px] text-muted-foreground/35">En pausa</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-400/15 via-violet-500/10 to-card p-6">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-rose-400/20 blur-3xl" />
                <div className="relative">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300">Tu universo favorito</p>
                  <p className="mt-4 font-display text-3xl font-semibold leading-tight">{genreData[0]?.name || "Aún por descubrir"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{genreData[0] ? `${genreData[0].value} de ${yearBooks.length} libros este año` : "Termina un libro para verlo aquí."}</p>
                  {genreData[0] && <div className="mt-6 h-2 overflow-hidden rounded-full bg-background/50"><div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.round((genreData[0].value / yearBooks.length) * 100)}%` }} /></div>}
                  <div className="mt-6 space-y-2">
                    {genreData.slice(0, 4).map((genre, index) => (
                      <div key={genre.name} className="flex items-center justify-between text-xs">
                        <span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: genreColorMap[genre.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length] }} /> <span className="truncate">{genre.name}</span></span>
                        <span className="font-semibold text-foreground">{genre.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <BookOfYear year={selectedYear} books={yearBooks} />

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
