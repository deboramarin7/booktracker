import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LOCAL_KEY = "book-tracker-reading-habits";

function loadLocal(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch { return {}; }
}

function saveLocal(data: Record<string, string[]>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export function useReadingHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Record<string, string[]>>(loadLocal);
  const [loading, setLoading] = useState(false);

  // Load from Supabase on mount
  const fetchHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reading_habits")
      .select("date")
      .eq("user_id", user.id);
    if (!error && data && data.length > 0) {
      const remote: Record<string, string[]> = {};
      data.forEach((row: { date: string }) => {
        const year = row.date.substring(0, 4);
        if (!remote[year]) remote[year] = [];
        remote[year].push(row.date);
      });
      // Merge local + remote
      const local = loadLocal();
      const merged: Record<string, string[]> = { ...local };
      Object.entries(remote).forEach(([year, dates]) => {
        const combined = Array.from(new Set([...(merged[year] || []), ...dates]));
        merged[year] = combined;
      });
      setHabits(merged);
      saveLocal(merged);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  // Toggle a day — add or remove
  const toggleDay = useCallback(async (dateStr: string) => {
    const year = dateStr.substring(0, 4);
    const current = habits[year] || [];
    const isMarked = current.includes(dateStr);
    const updated = { ...habits };

    if (isMarked) {
      updated[year] = current.filter(d => d !== dateStr);
      if (user) {
        await supabase.from("reading_habits")
          .delete()
          .eq("user_id", user.id)
          .eq("date", dateStr);
      }
    } else {
      updated[year] = [...current, dateStr];
      if (user) {
        await supabase.from("reading_habits")
          .upsert({ user_id: user.id, date: dateStr }, { onConflict: "user_id,date" });
      }
    }

    setHabits(updated);
    saveLocal(updated);
  }, [habits, user]);

  return { habits, toggleDay, loading };
}
