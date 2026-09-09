import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const KEY = "book-tracker-reading-goals";
const db = supabase as any;

export function useReadingGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Record<number, number>>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } });
  useEffect(() => { if (!user) return; (async () => { const { data } = await db.from("reading_goals").select("year,target").eq("user_id", user.id); if (data?.length) setGoals(Object.fromEntries(data.map((item: any) => [item.year, item.target]))); })(); }, [user?.id]);
  const saveGoal = async (year: number, target: number) => { const next = { ...goals, [year]: target }; setGoals(next); localStorage.setItem(KEY, JSON.stringify(next)); if (user) await db.from("reading_goals").upsert({ user_id: user.id, year, target, updated_at: new Date().toISOString() }, { onConflict: "user_id,year" }); };
  return { goals, saveGoal };
}
