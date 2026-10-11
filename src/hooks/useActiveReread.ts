import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ActiveReread {
  id: string;
  bookId: string;
  startedAt: string;
  pagesRead: number;
}

const db = supabase as any;

export function useActiveReread() {
  const { user } = useAuth();
  const [activeReread, setActiveReread] = useState<ActiveReread | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveReread = useCallback(async () => {
    if (!user) {
      setActiveReread(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await db
      .from("active_rereads")
      .select("id, book_id, started_at, pages_read")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading active reread:", error);
      setActiveReread(null);
    } else if (data) {
      setActiveReread({ id: data.id, bookId: data.book_id, startedAt: data.started_at, pagesRead: data.pages_read || 0 });
    } else {
      setActiveReread(null);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchActiveReread(); }, [fetchActiveReread]);

  const startReread = useCallback(async (bookId: string) => {
    if (!user || activeReread) return false;
    const startedAt = new Date().toISOString().slice(0, 10);
    const { data, error } = await db
      .from("active_rereads")
      .insert({ user_id: user.id, book_id: bookId, started_at: startedAt, pages_read: 0 })
      .select("id, book_id, started_at, pages_read")
      .single();

    if (error) {
      console.error("Error starting reread:", error);
      return false;
    }
    setActiveReread({ id: data.id, bookId: data.book_id, startedAt: data.started_at, pagesRead: data.pages_read || 0 });
    return true;
  }, [activeReread, user]);

  const updatePages = useCallback(async (pagesRead: number) => {
    if (!user || !activeReread) return false;
    const safePages = Math.max(0, pagesRead || 0);
    const { error } = await db
      .from("active_rereads")
      .update({ pages_read: safePages })
      .eq("id", activeReread.id)
      .eq("user_id", user.id);
    if (error) return false;
    setActiveReread((current) => current ? { ...current, pagesRead: safePages } : null);
    return true;
  }, [activeReread, user]);

  const clearActiveReread = useCallback(async () => {
    if (!user || !activeReread) return false;
    const { error } = await db.from("active_rereads").delete().eq("id", activeReread.id).eq("user_id", user.id);
    if (error) return false;
    setActiveReread(null);
    return true;
  }, [activeReread, user]);

  return { activeReread, loading, startReread, updatePages, clearActiveReread, refetch: fetchActiveReread };
}
