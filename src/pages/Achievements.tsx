import { useState, useMemo, useEffect } from "react";
import { useBooksContext } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Trophy, Target, BookOpen, Flame, Star, Crown, Zap,
  BookMarked, Library, Calendar, Medal, Sparkles, Check,
  Lock, Globe, Heart, Compass, TrendingUp,
} from "lucide-react";

const MONTHLY_GOALS_KEY = "book-tracker-monthly-goals";
const HABITS_KEY = "book-tracker-reading-habits";

function loadMonthlyGoals(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(MONTHLY_GOALS_KEY) || "{}"); } catch { return {}; }
}
function saveMonthlyGoals(data: Record<string, number>) {
  localStorage.setItem(MONTHLY_GOALS_KEY, JSON.stringify(data));
}
function loadHabits(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(HABITS_KEY) || "{}"); } catch { return {}; }
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type AchievementCategory = "constancia" | "volumen" | "exploraciÃ³n";

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress: { current: number; target: number };
  color: string;
  category: AchievementCategory;
}

const CATEGORY_META: Record<AchievementCategory, { label: string; icon: React.ReactNode; gradient: string }> = {
  constancia: { label: "Constancia", icon: <Flame className="h-5 w-5" />, gradient: "from-orange-500/15 via-amber-500/5 to-transparent" },
  volumen: { label: "Volumen", icon: <TrendingUp className="h-5 w-5" />, gradient: "from-blue-500/15 via-indigo-500/5 to-transparent" },
  exploraciÃ³n: { label: "ExploraciÃ³n", icon: <Compass className="h-5 w-5" />, gradient: "from-emerald-500/15 via-teal-500/5 to-transparent" },
};

// --- Achievement Card ---
function AchievementCard({ a }: { a: Achievement }) {
  const pct = (a.progress.current / a.progress.target) * 100;
  const isInProgress = !a.unlocked && a.progress.current > 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl p-5 transition-all duration-300 border",
        a.unlocked
          ? "bg-card border-border/40 shadow-lg"
          : isInProgress
          ? "bg-card/80 border-border/30"
          : "bg-muted/20 border-border/15"
      )}
    >
      {/* Glow effect for unlocked */}
      {a.unlocked && (
        <div
          className="absolute inset-0 rounded-2xl opacity-20 blur-xl pointer-events-none"
          style={{ backgroundColor: a.color }}
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
            a.unlocked
              ? "text-white shadow-lg"
              : isInProgress
              ? "bg-muted/60 text-muted-foreground"
              : "bg-muted/30 text-muted-foreground/40"
          )}
          style={a.unlocked ? { backgroundColor: a.color, boxShadow: `0 4px 20px ${a.color}40` } : undefined}
        >
          {a.unlocked ? a.icon : isInProgress ? a.icon : <Lock className="h-5 w-5" />}
          {a.unlocked && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-card">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-display font-semibold text-sm",
            a.unlocked ? "text-foreground" : isInProgress ? "text-foreground/80" : "text-muted-foreground/60"
          )}>
            {a.title}
          </p>
          <p className={cn(
            "text-[11px] mt-0.5",
            a.unlocked ? "text-muted-foreground" : "text-muted-foreground/50"
          )}>
            {a.description}
          </p>

          {/* Progress bar */}
          <div className="mt-2.5 space-y-1">
            <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted/40">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  a.unlocked ? "bg-emerald-500" : isInProgress ? "bg-primary/60" : "bg-muted-foreground/10"
                )}
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  ...(a.unlocked ? { backgroundColor: a.color } : {}),
                }}
              />
            </div>
            <p className={cn(
              "text-[10px] tabular-nums",
              a.unlocked ? "text-muted-foreground" : "text-muted-foreground/50"
            )}>
              {a.progress.current.toLocaleString()} / {a.progress.target.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Achievements() {
  const { books } = useBooksContext();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthlyGoals, setMonthlyGoals] = useState<Record<string, number>>(loadMonthlyGoals);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | "all">("all");

  const finishedBooks = useMemo(() => books.filter(b => b.status === "finished"), [books]);

  const yearFinished = useMemo(() => {
    return finishedBooks.filter(b => {
      const dateStr = b.endDate || b.startDate || b.addedAt;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
    });
  }, [finishedBooks, selectedYear]);

  const [habits, setHabits] = useState<Record<string, string[]>>(loadHabits);
  useEffect(() => { setHabits(loadHabits()); }, [selectedYear]);
  const yearDays = useMemo(() => habits[String(selectedYear)] || [], [habits, selectedYear]);

  const maxStreak = useMemo(() => {
    const allDays = [...yearDays].sort();
    if (allDays.length === 0) return 0;
    let max = 1, current = 1;
    for (let i = 1; i < allDays.length; i++) {
      const prev = new Date(allDays[i - 1]);
      const curr = new Date(allDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { current++; max = Math.max(max, current); }
      else if (diff > 1) current = 1;
    }
    return Math.max(max, current);
  }, [yearDays]);

  const totalReadDays = yearDays.length;
  const uniqueAuthors = useMemo(() => new Set(yearFinished.map(b => b.author)).size, [yearFinished]);
  const uniqueGenres = useMemo(() => new Set(yearFinished.filter(b => b.genre).map(b => b.genre)).size, [yearFinished]);
  const fiveStarBooks = useMemo(() => yearFinished.filter(b => b.rating === 5).length, [yearFinished]);
  const totalPages = useMemo(() => yearFinished.reduce((s, b) => s + b.totalPages, 0), [yearFinished]);
  const uniqueSagas = useMemo(() => new Set(yearFinished.filter(b => b.hasSaga && b.saga).map(b => b.saga)).size, [yearFinished]);
  const formatsUsed = useMemo(() => new Set(yearFinished.filter(b => b.format).map(b => b.format)).size, [yearFinished]);

  const achievements: Achievement[] = useMemo(() => [
    // ââ CONSTANCIA ââ
    { id: "streak_3", icon: <Flame className="h-6 w-6" />, title: "Chispa", description: "3 dÃ­as seguidos leyendo", unlocked: maxStreak >= 3, progress: { current: Math.min(maxStreak, 3), target: 3 }, color: "hsl(25, 80%, 55%)", category: "constancia" as const },
    { id: "streak_7", icon: <Flame className="h-6 w-6" />, title: "Semana en Llamas", description: "7 dÃ­as seguidos leyendo", unlocked: maxStreak >= 7, progress: { current: Math.min(maxStreak, 7), target: 7 }, color: "hsl(15, 85%, 50%)", category: "constancia" as const },
    { id: "streak_14", icon: <Zap className="h-6 w-6" />, title: "Quincena de Fuego", description: "14 dÃ­as seguidos leyendo", unlocked: maxStreak >= 14, progress: { current: Math.min(maxStreak, 14), target: 14 }, color: "hsl(40, 90%, 50%)", category: "constancia" as const },
    { id: "streak_30", icon: <Crown className="h-6 w-6" />, title: "Imparable", description: "30 dÃ­as seguidos leyendo", unlocked: maxStreak >= 30, progress: { current: Math.min(maxStreak, 30), target: 30 }, color: "hsl(50, 95%, 50%)", category: "constancia" as const },
    { id: "50_days", icon: <Calendar className="h-6 w-6" />, title: "Medio Centenar", description: `50 dÃ­as de lectura en ${selectedYear}`, unlocked: totalReadDays >= 50, progress: { current: Math.min(totalReadDays, 50), target: 50 }, color: "hsl(30, 70%, 50%)", category: "constancia" as const },
    { id: "100_days", icon: <Calendar className="h-6 w-6" />, title: "Centenario", description: `100 dÃ­as de lectura en ${selectedYear}`, unlocked: totalReadDays >= 100, progress: { current: Math.min(totalReadDays, 100), target: 100 }, color: "hsl(20, 75%, 45%)", category: "constancia" as const },
    { id: "200_days", icon: <Sparkles className="h-6 w-6" />, title: "Leyenda", description: `200 dÃ­as de lectura en ${selectedYear}`, unlocked: totalReadDays >= 200, progress: { current: Math.min(totalReadDays, 200), target: 200 }, color: "hsl(10, 80%, 40%)", category: "constancia" as const },

    // ââ VOLUMEN ââ
    { id: "first_book", icon: <BookOpen className="h-6 w-6" />, title: "Primer Libro", description: `Termina tu primer libro en ${selectedYear}`, unlocked: yearFinished.length >= 1, progress: { current: Math.min(yearFinished.length, 1), target: 1 }, color: "hsl(210, 70%, 55%)", category: "volumen" as const },
    { id: "five_books", icon: <BookMarked className="h-6 w-6" />, title: "Lector Novato", description: `Termina 5 libros en ${selectedYear}`, unlocked: yearFinished.length >= 5, progress: { current: Math.min(yearFinished.length, 5), target: 5 }, color: "hsl(220, 65%, 50%)", category: "volumen" as const },
    { id: "ten_books", icon: <Library className="h-6 w-6" />, title: "Lector Dedicado", description: `Termina 10 libros en ${selectedYear}`, unlocked: yearFinished.length >= 10, progress: { current: Math.min(yearFinished.length, 10), target: 10 }, color: "hsl(240, 55%, 55%)", category: "volumen" as const },
    { id: "25_books", icon: <Trophy className="h-6 w-6" />, title: "BibliÃ³filo", description: `Termina 25 libros en ${selectedYear}`, unlocked: yearFinished.length >= 25, progress: { current: Math.min(yearFinished.length, 25), target: 25 }, color: "hsl(260, 50%, 55%)", category: "volumen" as const },
    { id: "50_books", icon: <Crown className="h-6 w-6" />, title: "Devoralibros", description: `Termina 50 libros en ${selectedYear}`, unlocked: yearFinished.length >= 50, progress: { current: Math.min(yearFinished.length, 50), target: 50 }, color: "hsl(280, 55%, 50%)", category: "volumen" as const },
    { id: "1000_pages", icon: <Target className="h-6 w-6" />, title: "Mil PÃ¡ginas", description: `Lee 1.000 pÃ¡ginas en ${selectedYear}`, unlocked: totalPages >= 1000, progress: { current: Math.min(totalPages, 1000), target: 1000 }, color: "hsl(200, 60%, 50%)", category: "volumen" as const },
    { id: "5000_pages", icon: <Target className="h-6 w-6" />, title: "Maratonista", description: `Lee 5.000 pÃ¡ginas en ${selectedYear}`, unlocked: totalPages >= 5000, progress: { current: Math.min(totalPages, 5000), target: 5000 }, color: "hsl(230, 60%, 50%)", category: "volumen" as const },
    { id: "10000_pages", icon: <Sparkles className="h-6 w-6" />, title: "Ultra Lector", description: `Lee 10.000 pÃ¡ginas en ${selectedYear}`, unlocked: totalPages >= 10000, progress: { current: Math.min(totalPages, 10000), target: 10000 }, color: "hsl(270, 60%, 50%)", category: "volumen" as const },

    // ââ EXPLORACIÃN ââ
    { id: "3_genres", icon: <Globe className="h-6 w-6" />, title: "Curioso", description: "Lee 3 gÃ©neros diferentes", unlocked: uniqueGenres >= 3, progress: { current: Math.min(uniqueGenres, 3), target: 3 }, color: "hsl(150, 55%, 45%)", category: "exploraciÃ³n" as const },
    { id: "5_genres", icon: <Medal className="h-6 w-6" />, title: "EclÃ©ctico", description: "Lee 5 gÃ©neros diferentes", unlocked: uniqueGenres >= 5, progress: { current: Math.min(uniqueGenres, 5), target: 5 }, color: "hsl(160, 50%, 42%)", category: "exploraciÃ³n" as const },
    { id: "3_authors", icon: <Compass className="h-6 w-6" />, title: "Descubridor", description: "Lee a 3 autores diferentes", unlocked: uniqueAuthors >= 3, progress: { current: Math.min(uniqueAuthors, 3), target: 3 }, color: "hsl(170, 50%, 40%)", category: "exploraciÃ³n" as const },
    { id: "5_authors", icon: <Compass className="h-6 w-6" />, title: "Explorador", description: "Lee a 5 autores diferentes", unlocked: uniqueAuthors >= 5, progress: { current: Math.min(uniqueAuthors, 5), target: 5 }, color: "hsl(180, 50%, 38%)", category: "exploraciÃ³n" as const },
    { id: "10_authors", icon: <Sparkles className="h-6 w-6" />, title: "Coleccionista", description: "Lee a 10 autores diferentes", unlocked: uniqueAuthors >= 10, progress: { current: Math.min(uniqueAuthors, 10), target: 10 }, color: "hsl(140, 45%, 40%)", category: "exploraciÃ³n" as const },
    { id: "five_star", icon: <Star className="h-6 w-6" />, title: "Exigente", description: "Da 5â a 3 libros", unlocked: fiveStarBooks >= 3, progress: { current: Math.min(fiveStarBooks, 3), target: 3 }, color: "hsl(45, 100%, 50%)", category: "exploraciÃ³n" as const },
    { id: "saga_lover", icon: <Heart className="h-6 w-6" />, title: "Saga Lover", description: "Lee libros de 3 sagas diferentes", unlocked: uniqueSagas >= 3, progress: { current: Math.min(uniqueSagas, 3), target: 3 }, color: "hsl(340, 60%, 50%)", category: "exploraciÃ³n" as const },
    { id: "multi_format", icon: <BookOpen className="h-6 w-6" />, title: "Multiformato", description: "Lee en 2 formatos (fÃ­sico + digital)", unlocked: formatsUsed >= 2, progress: { current: Math.min(formatsUsed, 2), target: 2 }, color: "hsl(190, 55%, 42%)", category: "exploraciÃ³n" as const },
  ], [yearFinished, maxStreak, fiveStarBooks, uniqueAuthors, uniqueGenres, totalReadDays, totalPages, uniqueSagas, formatsUsed, selectedYear]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const filteredAchievements = categoryFilter === "all"
    ? achievements
    : achievements.filter(a => a.category === categoryFilter);

  // Sort: unlocked first, then by progress %
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    const pctA = a.progress.current / a.progress.target;
    const pctB = b.progress.current / b.progress.target;
    return pctB - pctA;
  });

  // Category counts
  const categoryCounts = {
    constancia: achievements.filter(a => a.category === "constancia" && a.unlocked).length,
    volumen: achievements.filter(a => a.category === "volumen" && a.unlocked).length,
    exploraciÃ³n: achievements.filter(a => a.category === "exploraciÃ³n" && a.unlocked).length,
  };
  const categoryTotals = {
    constancia: achievements.filter(a => a.category === "constancia").length,
    volumen: achievements.filter(a => a.category === "volumen").length,
    exploraciÃ³n: achievements.filter(a => a.category === "exploraciÃ³n").length,
  };

  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, i) => {
      const key = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      const goal = monthlyGoals[key] || 0;
      const read = finishedBooks.filter(b => {
        const dateStr = b.endDate || b.startDate || b.addedAt;
        const d = new Date(dateStr);
        return d.getFullYear() === selectedYear && d.getMonth() === i;
      }).length;
      const isPast = selectedYear < currentYear || (selectedYear === currentYear && i < currentMonth);
      const isCurrent = selectedYear === currentYear && i === currentMonth;
      return { name, index: i, key, goal, read, isPast, isCurrent };
    });
  }, [selectedYear, finishedBooks, monthlyGoals, currentYear, currentMonth]);

  const handleSaveGoal = (monthKey: string) => {
    const val = parseInt(editValue);
    if (!isNaN(val) && val >= 0) {
      const updated = { ...monthlyGoals, [monthKey]: val };
      setMonthlyGoals(updated);
      saveMonthlyGoals(updated);
    }
    setEditingMonth(null);
    setEditValue("");
  };

  const yearGoalTotal = monthlyData.reduce((s, m) => s + m.goal, 0);
  const yearReadTotal = monthlyData.reduce((s, m) => s + m.read, 0);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold font-display">ð¯ Logros y Retos</h2>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* âââ SUMMARY + CATEGORY STATS âââ */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="border-none bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent sm:col-span-1">
          <CardContent className="p-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            <p className="text-3xl font-bold font-display">{unlockedCount}</p>
            <p className="text-xs text-muted-foreground">de {achievements.length} logros</p>
            <div className="mt-3">
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category cards */}
        {(Object.entries(CATEGORY_META) as [AchievementCategory, typeof CATEGORY_META["constancia"]][]).map(([cat, meta]) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
            className={cn(
              "text-left rounded-lg border p-4 transition-all",
              categoryFilter === cat
                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/30 hover:border-border/60 bg-card"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg", `bg-gradient-to-br ${meta.gradient}`)}>
                {meta.icon}
              </div>
              <span className="text-sm font-display font-semibold">{meta.label}</span>
            </div>
            <p className="text-xl font-bold font-display">
              {categoryCounts[cat]}<span className="text-sm text-muted-foreground font-normal">/{categoryTotals[cat]}</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${(categoryCounts[cat] / categoryTotals[cat]) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* âââ ACHIEVEMENTS GRID âââ */}
      <div className="space-y-4">
        {categoryFilter !== "all" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-body">
              Mostrando: <span className="font-semibold text-foreground">{CATEGORY_META[categoryFilter].label}</span>
            </p>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCategoryFilter("all")}>
              Ver todos â
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAchievements.map(a => (
            <AchievementCard key={a.id} a={a} />
          ))}
        </div>
      </div>

      {/* âââ MONTHLY CHALLENGES âââ */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-display">ð Retos Mensuales {selectedYear}</h3>

        {yearGoalTotal > 0 && (
          <Card className="border-border/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold font-display">Progreso anual</span>
                <span className="text-sm text-muted-foreground font-body">{yearReadTotal}/{yearGoalTotal} libros</span>
              </div>
              <Progress value={yearGoalTotal > 0 ? (yearReadTotal / yearGoalTotal) * 100 : 0} className="h-2.5" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {monthlyData.map((m) => {
            const pct = m.goal > 0 ? Math.min((m.read / m.goal) * 100, 100) : 0;
            const completed = m.goal > 0 && m.read >= m.goal;
            return (
              <Card
                key={m.key}
                className={cn(
                  "transition-all border-border/30",
                  m.isCurrent && "ring-1 ring-primary/30",
                  completed && "bg-gradient-to-br from-emerald-500/5 to-emerald-400/5"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("font-semibold text-sm font-display", m.isCurrent && "text-primary")}>
                      {m.name}
                      {m.isCurrent && <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-body">Actual</span>}
                    </span>
                    {completed && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-body">
                    <span className="text-muted-foreground">LeÃ­dos:</span>
                    <span className="font-bold text-foreground">{m.read}</span>
                    {m.goal > 0 && (
                      <>
                        <span className="text-muted-foreground">/ Meta:</span>
                        <span className="font-bold text-primary">{m.goal}</span>
                      </>
                    )}
                  </div>

                  {m.goal > 0 && (
                    <Progress value={pct} className={cn("h-2", completed && "[&>div]:bg-emerald-500")} />
                  )}

                  {editingMonth === m.index ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Meta"
                        className="h-8 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleSaveGoal(m.key)}
                      />
                      <Button size="sm" className="h-8" onClick={() => handleSaveGoal(m.key)}>OK</Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground w-full hover:text-foreground"
                      onClick={() => { setEditingMonth(m.index); setEditValue(String(m.goal || "")); }}
                    >
                      {m.goal > 0 ? "Cambiar meta" : "Fijar meta"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
