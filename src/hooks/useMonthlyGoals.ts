import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function localKey(userId: string) {
  return `book-tracker-monthly-goals:${userId}`;
}

function readLocalGoals(userId: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(localKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function useMonthlyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setGoals({});
      setLoading(false);
      return;
    }

    const userId = user.id;
    setGoals(readLocalGoals(userId));
    setLoading(true);

    const loadGoals = async () => {
      const { data, error } = await supabase
        .from("monthly_goals")
        .select("month, goal")
        .eq("user_id", userId);

      if (cancelled) return;

      if (error) {
        console.error("Error loading monthly goals:", error);
        setLoading(false);
        return;
      }

      const remoteGoals = Object.fromEntries(
        (data || []).map((row: { month: string; goal: number }) => [row.month, row.goal])
      ) as Record<string, number>;
      const mergedGoals = { ...readLocalGoals(userId), ...remoteGoals };

      setGoals(mergedGoals);
      localStorage.setItem(localKey(userId), JSON.stringify(mergedGoals));
      setLoading(false);
    };

    loadGoals();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const saveGoals = useCallback(async (updated: Record<string, number>) => {
    if (!user) return;

    setGoals(updated);
    localStorage.setItem(localKey(user.id), JSON.stringify(updated));

    const { error } = await supabase.from("monthly_goals").upsert(
      Object.entries(updated).map(([month, goal]) => ({
        user_id: user.id,
        month,
        goal,
      })),
      { onConflict: "user_id,month" }
    );

    if (error) console.error("Error saving monthly goals:", error);
  }, [user]);

  return { goals, setGoals: saveGoals, loading };
}
