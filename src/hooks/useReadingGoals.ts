import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

/** La copia local debe incluir el usuario: antes se compartía entre perfiles. */
function localKey(userId: string) {
  return `book-tracker-reading-goals:${userId}`;
}

function readLocalGoals(userId: string): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem(localKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function useReadingGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;

    // Al cerrar sesión o cambiar de perfil, no mostramos datos del anterior.
    if (!user) {
      setGoals({});
      return;
    }

    const userId = user.id;
    setGoals(readLocalGoals(userId));

    const loadGoals = async () => {
      const { data, error } = await db
        .from("reading_goals")
        .select("year, target")
        .eq("user_id", userId);

      if (cancelled || error) {
        if (error) console.error("Error loading reading goals:", error);
        return;
      }

      // Supabase es la fuente de verdad. Si la cuenta no tiene datos todavía,
      // solo se conserva su propia copia local, nunca la de otro perfil.
      const remoteGoals = Object.fromEntries(
        (data || []).map((item: { year: number; target: number }) => [item.year, item.target])
      ) as Record<number, number>;
      const mergedGoals = { ...readLocalGoals(userId), ...remoteGoals };

      setGoals(mergedGoals);
      localStorage.setItem(localKey(userId), JSON.stringify(mergedGoals));
    };

    loadGoals();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const saveGoal = useCallback(async (year: number, target: number) => {
    if (!user) return;

    const safeTarget = Math.max(0, Math.floor(target));
    const nextGoals = { ...goals, [year]: safeTarget };
    setGoals(nextGoals);
    localStorage.setItem(localKey(user.id), JSON.stringify(nextGoals));

    const { error } = await db.from("reading_goals").upsert(
      {
        user_id: user.id,
        year,
        target: safeTarget,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,year" }
    );

    if (error) console.error("Error saving reading goal:", error);
  }, [goals, user]);

  return { goals, saveGoal };
}
