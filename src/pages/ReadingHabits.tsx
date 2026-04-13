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
    {/* Un solo contenedor con scroll — labels y grid juntos */}
    <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      <div style={{ minWidth: `${weeks.length * 14 + 28}px` }}>
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
        {/* Day labels + grid */}
        <div className="flex gap-0">
          <div className="flex flex-col gap-[4px] mr-1 text-[10px] text-muted-foreground pt-0">
            {["", "Mar", "", "Jue", "", "Sáb", ""].map((d, i) => (
              <div key={i} className="h-[11px] flex items-center justify-end pr-0.5 w-6">{d}</div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <Tooltip key={day.key}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-[18px] h-[18px] rounded-[2px] transition-colors",
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
      </div>
    </div>
    {/* Legend — simplificada (solo 2 niveles reales) */}
    
