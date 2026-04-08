import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { CalendarDays, Flame, ChevronLeft, ChevronRight, BookOpen, TrendingUp, Trophy, Zap } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBooksContext } from "@/components/Layout";

const HABITS_KEY = "book-tracker-reading-habits";

function loadHabits(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(HABITS_KEY) || "{}"); } catch { return {}; }
}
function saveHabits(data: Record<string, string[]>) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(data));
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface DayBooks {
  reading: { title: string; coverUrl?: string }[];
  started: { title: string }[];
  finished: { title: string }[];
}

// ═══════════════════════════════════════════
// GitHub-style Heatmap with INTENSITY levels
// ═══════════════════════════════════════════
function YearHeatmap({ year, habits }: { year: number; habits: Record<string, string[]> }) {
  const yearKey = String(year);
  const readDays = new Set(habits[yearKey] || []);

  // Count occurrences per day across all years for intensity
  // For simplicity, just use 0/1 for the selected year
  const weeks: { date: Date; key: string; isRead: boolean; isPad: boolean }[][] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  let currentWeek: typeof weeks[0] = [];
  const d = new Date(startDate);
  const firstDay = d.getDay() === 0 ? 6 : d.getDay() - 1;
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: new Date(0), key: `pad-${i}`, isRead: false, isPad: true });
  }

  while (d <= endDate) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    currentWeek.push({ date: new Date(d), key, isRead: readDays.has(key), isPad: false });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    d.setDate(d.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Month labels
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const nonPad = week.find(d => !d.isPad);
    if (nonPad) {
      const m = nonPad.date.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: MONTH_SHORT[m], weekIndex: wi });
        lastMonth = m;
      }
    }
  });

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex text-[9px] text-muted-foreground ml-7" style={{ gap: "3px" }}>
        {weeks.map((_, wi) => {
          const label = monthLabels.find(m => m.weekIndex === wi);
          return (
            <div key={wi} className="w-[11px] text-center flex-shrink-0">
              {label ? label.label : ""}
            </div>
          );
        })}
      </div>
      <div className="flex gap-0">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 text-[9px] text-muted-foreground pt-0">
          {["", "Mar", "", "Jue", "", "Sáb", ""].map((d, i) => (
            <div key={i} className="h-[11px] flex items-center justify-end pr-0.5 w-6">{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <Tooltip key={day.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-[11px] h-[11px] rounded-[2px] transition-colors",
                        day.isPad
                          ? "bg-transparent"
                          : day.isRead
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-muted/60 dark:bg-muted/30"
                      )}
                    />
                  </TooltipTrigger>
                  {!day.isPad && (
                    <TooltipContent side="top" className="text-xs py-1 px-2">
                      {day.date.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                      {day.isRead ? " — ✅ Leíste" : " — No leíste"}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
        <span>Menos</span>
        <div className="w-[11px] h-[11px] rounded-[2px] bg-muted/60 dark:bg-muted/30" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500/30 dark:bg-emerald-400/30" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500/60 dark:bg-emerald-400/60" />
        <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500 dark:bg-emerald-400" />
        <span>Más</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Streak ring / badge component
// ═══════════════════════════════════════════
function StreakBadge({ value, label, icon: Icon, color, size = "lg" }: {
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  size?: "sm" | "lg";
}) {
  const isLarge = size === "lg";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "relative rounded-full flex items-center justify-center",
        isLarge ? "w-28 h-28" : "w-20 h-20",
        value > 0
          ? `bg-gradient-to-br ${color} shadow-lg`
          : "bg-muted/30 border-2 border-dashed border-muted-foreground/20"
      )}>
        {value > 0 && (
          <div className={cn(
            "absolute inset-1 rounded-full flex flex-col items-center justify-center",
            "bg-card"
          )}>
            <Icon className={cn(
              isLarge ? "h-5 w-5 mb-0.5" : "h-4 w-4 mb-0.5",
              value > 0 ? "text-orange-500" : "text-muted-foreground/30"
            )} />
            <span className={cn(
              "font-bold font-display leading-none",
              isLarge ? "text-3xl" : "text-2xl",
              value > 0 ? "text-foreground" : "text-muted-foreground"
            )}>
              {value}
            </span>
          </div>
        )}
        {value === 0 && (
          <div className="flex flex-col items-center">
            <Icon className={cn(
              isLarge ? "h-5 w-5 mb-0.5" : "h-4 w-4 mb-0.5",
              "text-muted-foreground/30"
            )} />
            <span className={cn(
              "font-bold font-display leading-none text-muted-foreground",
              isLarge ? "text-3xl" : "text-2xl"
            )}>0</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-body text-center">{label}</p>
    </div>
  );
}

export default function ReadingHabits() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [habits, setHabits] = useState<Record<string, string[]>>(loadHabits);

  const yearKey = String(selectedYear);
  const readDays = habits[yearKey] || [];

  const toggleDay = (date: Date | undefined) => {
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const updated = { ...habits };
    const yearDays = [...(updated[yearKey] || [])];
    const idx = yearDays.indexOf(key);
    if (idx >= 0) yearDays.splice(idx, 1);
    else yearDays.push(key);
    updated[yearKey] = yearDays;
    setHabits(updated);
    saveHabits(updated);
  };

  const selectedDates = useMemo(() => readDays.map((d) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  }), [readDays]);

  const now = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    selectedYear === now.getFullYear() ? new Date(selectedYear, now.getMonth()) : new Date(selectedYear, 0)
  );

  const chartData = useMemo(() => {
    return MONTH_SHORT.map((name, i) => {
      const days = readDays.filter((d) => { const date = new Date(d); return date.getMonth() === i; }).length;
      return { name, days };
    });
  }, [readDays]);

  const totalDays = readDays.length;
  const currentMonthIndex = selectedYear === new Date().getFullYear() ? new Date().getMonth() : 11;
  const monthsElapsed = currentMonthIndex + 1;
  const avgPerMonth = monthsElapsed > 0 ? (totalDays / monthsElapsed).toFixed(1) : "0";
  const bestMonth = chartData.reduce((best, m) => m.days > best.days ? m : best, chartData[0]);

  // Current streak
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

  // Best streak ever (across all years)
  const bestStreak = useMemo(() => {
    const allDays = [...new Set(Object.values(habits).flat())].sort();
    if (allDays.length === 0) return 0;
    let max = 1, current = 1;
    for (let i = 1; i < allDays.length; i++) {
      const prev = new Date(allDays[i - 1]);
      const curr = new Date(allDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { current++; max = Math.max(max, current); }
      else { current = 1; }
    }
    return max;
  }, [habits]);

  // Consistency score
  const consistencyScore = useMemo(() => {
    const today = new Date();
    let totalElapsed: number;
    if (selectedYear === today.getFullYear()) {
      const start = new Date(selectedYear, 0, 1);
      totalElapsed = Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1;
    } else {
      totalElapsed = (selectedYear % 4 === 0 && (selectedYear % 100 !== 0 || selectedYear % 400 === 0)) ? 366 : 365;
    }
    return totalElapsed > 0 ? Math.round((totalDays / totalElapsed) * 100) : 0;
  }, [totalDays, selectedYear]);

  // === Reading Calendar logic ===
  const { books } = useBooksContext();
  const today2 = new Date();
  const [calYear, setCalYear] = useState(today2.getFullYear());
  const [calMonth, setCalMonth] = useState(today2.getMonth());

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);

  const dayMap = useMemo(() => {
    const map = new Map<number, DayBooks>();
    for (let d = 1; d <= daysInMonth; d++) {
      map.set(d, { reading: [], started: [], finished: [] });
    }
    books.forEach((book) => {
      const start = book.startDate ? new Date(book.startDate) : null;
      const end = book.endDate ? new Date(book.endDate) : null;
      if (start && start.getFullYear() === calYear && start.getMonth() === calMonth) {
        map.get(start.getDate())?.started.push({ title: book.title });
      }
      if (end && end.getFullYear() === calYear && end.getMonth() === calMonth) {
        map.get(end.getDate())?.finished.push({ title: book.title });
      }
      if (start) {
        const readEnd = end || new Date();
        const monthStart = new Date(calYear, calMonth, 1);
        const monthEnd = new Date(calYear, calMonth, daysInMonth, 23, 59, 59);
        if (start <= monthEnd && readEnd >= monthStart) {
          const from = Math.max(1, start >= monthStart ? start.getDate() : 1);
          const to = Math.min(daysInMonth, readEnd <= monthEnd ? readEnd.getDate() : daysInMonth);
          for (let d = from; d <= to; d++) {
            map.get(d)?.reading.push({ title: book.title, coverUrl: book.coverUrl });
          }
        }
      }
    });
    return map;
  }, [books, calYear, calMonth, daysInMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const isTodayCal = (d: number) =>
    calYear === today2.getFullYear() && calMonth === today2.getMonth() && d === today2.getDate();

  const booksStarted = new Set<string>();
  const booksFinished = new Set<string>();
  const daysReadingCount = new Set<number>();
  dayMap.forEach((val, day) => {
    val.started.forEach((b) => booksStarted.add(b.title));
    val.finished.forEach((b) => booksFinished.add(b.title));
    if (val.reading.length > 0) daysReadingCount.add(day);
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-display font-bold">📚 Hábitos y Calendario</h2>

      <Tabs defaultValue="habits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="habits">📊 Hábitos</TabsTrigger>
          <TabsTrigger value="calendar">📅 Calendario</TabsTrigger>
        </TabsList>

        {/* ===== HABITS TAB ===== */}
        <TabsContent value="habits" className="space-y-8 mt-6">

          {/* ── STREAK HERO ── */}
          <Card className={cn(
            "border-none overflow-hidden relative",
            streak > 0
              ? "bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-yellow-500/5"
              : "bg-gradient-to-br from-muted/40 to-muted/20"
          )}>
            {streak > 0 && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            )}
            <CardContent className="p-8 sm:p-10 relative">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
                {/* Current streak */}
                <StreakBadge
                  value={streak}
                  label="Racha actual"
                  icon={Flame}
                  color="from-orange-500/30 to-amber-500/20"
                  size="lg"
                />
                {/* Best streak */}
                <StreakBadge
                  value={bestStreak}
                  label="Mejor racha"
                  icon={Trophy}
                  color="from-amber-500/30 to-yellow-500/20"
                  size="sm"
                />
              </div>

              {/* Motivational text */}
              {streak > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-6 font-body">
                  {streak >= 30 ? "🔥 ¡Increíble! Un mes entero leyendo sin parar." :
                   streak >= 14 ? "🔥 ¡Dos semanas seguidas! Estás en racha." :
                   streak >= 7 ? "🔥 ¡Una semana! Sigue así." :
                   streak >= 3 ? "¡Buen ritmo! No pares ahora." :
                   "¡Has empezado! Vuelve mañana para mantener la racha."}
                </p>
              )}
              {streak === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-6 font-body">
                  Marca el día de hoy como leído para empezar tu racha 🔥
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── QUICK STATS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Días leídos", value: totalDays, icon: CalendarDays },
              { label: "Media/mes", value: avgPerMonth, icon: TrendingUp },
              { label: `Mejor mes (${bestMonth.name})`, value: bestMonth.days, icon: Zap },
              { label: "Consistencia", value: `${consistencyScore}%`, icon: Trophy },
            ].map(stat => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-muted/30 border border-border/20">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon className="h-3.5 w-3.5 text-primary/50" />
                </div>
                <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── HEATMAP ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold font-body text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary/60" />
                Mapa de lectura
              </p>
              <Select value={String(selectedYear)} onValueChange={(v) => {
                const y = Number(v);
                setSelectedYear(y);
                setVisibleMonth(y === now.getFullYear() ? new Date(y, now.getMonth()) : new Date(y, 0));
              }}>
                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card className="border-border/30">
              <CardContent className="p-4 sm:p-6">
                <YearHeatmap year={selectedYear} habits={habits} />
              </CardContent>
            </Card>
          </div>

          {/* ── CALENDAR PICKER ── */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-body">Haz clic en un día para marcar/desmarcar que leíste</p>
            <Card className="border-border/30">
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onDayClick={toggleDay}
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  fromDate={new Date(selectedYear, 0, 1)}
                  toDate={new Date(selectedYear, 11, 31)}
                  className={cn("p-3 pointer-events-auto")}
                  classNames={{
                    day_selected: "bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-white",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── BAR CHART: Días por mes ── */}
          <Card className="border-border/30">
            <CardContent className="pt-6 pb-4">
              <p className="text-sm font-semibold font-body text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary/60" />
                Días de lectura por mes
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={24} />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value} días`, ""]}
                    contentStyle={{
                      borderRadius: "10px",
                      fontSize: "13px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.days > 0 ? "hsl(152, 60%, 42%)" : "hsl(var(--muted))"}
                        opacity={entry.days > 0 ? 0.85 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CALENDAR TAB ===== */}
        <TabsContent value="calendar" className="space-y-6 mt-6">
          {/* Month stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/20">
              <p className="text-3xl font-bold text-foreground font-display">{daysReadingCount.size}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Días leyendo</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-display">{booksStarted.size}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Empezados</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-3xl font-bold text-accent font-display">{booksFinished.size}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Terminados</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold font-display">
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
            <div className="grid grid-cols-7">
              {DAY_NAMES.map((name) => (
                <div key={name} className="p-2 text-center text-xs font-medium text-muted-foreground border-b bg-muted/20">
                  {name}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/20 bg-muted/5" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const data = dayMap.get(day)!;
                const hasActivity = data.reading.length > 0;
                const hasStarted = data.started.length > 0;
                const hasFinished = data.finished.length > 0;

                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "min-h-[100px] border-b border-r border-border/20 p-1.5 transition-colors cursor-default",
                          isTodayCal(day) && "bg-primary/10 ring-1 ring-primary ring-inset",
                          hasActivity && !isTodayCal(day) && "bg-emerald-500/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn("text-xs font-medium", isTodayCal(day) ? "text-primary font-bold" : "text-foreground")}>
                            {day}
                          </span>
                          {hasActivity && <BookOpen className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />}
                        </div>
                        <div className="space-y-0.5">
                          {data.reading.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-0.5">
                              {data.reading.slice(0, 3).map((b, idx) =>
                                <BookCoverImage
                                  key={idx}
                                  src={b.coverUrl}
                                  className="w-10 h-14 rounded-sm object-cover border border-background shadow-sm"
                                  fallbackClassName="w-10 h-14 rounded-sm border border-background bg-primary/20"
                                  iconClassName="h-4 w-4"
                                />
                              )}
                              {data.reading.length > 3 && (
                                <span className="text-[8px] text-muted-foreground self-end">+{data.reading.length - 3}</span>
                              )}
                            </div>
                          )}
                          {hasStarted && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 truncate max-w-full">📖</Badge>
                          )}
                          {hasFinished && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-accent/10 text-accent border-accent/30 truncate max-w-full">✅</Badge>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      {data.reading.length === 0 ? (
                        <p className="text-xs">Sin actividad</p>
                      ) : (
                        <div className="space-y-1">
                          {data.started.map((b, i) => (
                            <p key={`s-${i}`} className="text-xs">📖 Empezaste: <strong>{b.title}</strong></p>
                          ))}
                          {data.finished.map((b, i) => (
                            <p key={`f-${i}`} className="text-xs">✅ Terminaste: <strong>{b.title}</strong></p>
                          ))}
                          {data.reading.filter(b => !data.started.some(s => s.title === b.title) && !data.finished.some(f => f.title === b.title)).map((b, i) => (
                            <p key={`r-${i}`} className="text-xs">📚 Leyendo: <strong>{b.title}</strong></p>
                          ))}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/10 border border-emerald-500/30" />
              <span>Día de lectura</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>📖</span><span>Libro empezado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>✅</span><span>Libro terminado</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
