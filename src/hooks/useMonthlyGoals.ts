import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LOCAL_KEY = "book-tracker-monthly-goals";

function loadLocal(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); } catch { return {}; }
}

export function useMonthlyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Record<string, number>>(loadLocal);
  const [loading, setLoading] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("monthly_goals")
      .select("month, goal")
      .eq("user_id", user.id);
    if (!error && data && data.length > 0) {
      const remote: Record<string, number> = {};
      data.forEach((row: { month: string; goal: number }) => {
        remote[row.month] = row.goal;
      });
      // Merge: remote wins over local
      const merged = { ...loadLocal(), ...remote };
      setGoals(merged);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const saveGoal = useCallback(async (updated: Record<string, number>) => {
    setGoals(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    if (!user) return;
    try {
      await supabase.from("monthly_goals").upsert(
        Object.entries(updated).map(([month, goal]) => ({
          user_id: user.id,
          month,
          goal,
        })),
        { onConflict: "user_id,month" }
      );
    } catch (e) {
      console.error("Error saving monthly goals:", e);
    }
  }, [user]);

  return { goals, setGoals: saveGoal, loading };
}
