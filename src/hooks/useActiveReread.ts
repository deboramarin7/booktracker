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
  const [activeRereads, setActiveRereads] = useState<ActiveReread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveReread = useCallback(async () => {
    if (!user) {
      setActiveRereads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await db
      .from("active_rereads")
      .select("id, book_id, started_at, pages_read")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error loading active reread:", error);
      setActiveRereads([]);
    } else {
      setActiveRereads((data || []).map((item: any) => ({ id: item.id, bookId: item.book_id, startedAt: item.started_at, pagesRead: item.pages_read || 0 })));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchActiveReread(); }, [fetchActiveReread]);

  const startReread = useCallback(async (bookId: string) => {
    if (!user || activeRereads.some((item) => item.bookId === bookId)) return false;
    const startedAt = new Date().toLocaleDateString("en-CA");
    const { data, error } = await db
      .from("active_rereads")
      .insert({ user_id: user.id, book_id: bookId, started_at: startedAt, pages_read: 0 })
      .select("id, book_id, started_at, pages_read")
      .single();

    if (error) {
      console.error("Error starting reread:", error);
      return false;
    }
    setActiveRereads((current) => [{ id: data.id, bookId: data.book_id, startedAt: data.started_at, pagesRead: data.pages_read || 0 }, ...current]);
    return true;
  }, [activeRereads, user]);

  const updatePages = useCallback(async (id: string, pagesRead: number) => {
    if (!user) return false;
    const safePages = Math.max(0, pagesRead || 0);
    const { error } = await db
      .from("active_rereads")
      .update({ pages_read: safePages })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return false;
    setActiveRereads((current) => current.map((item) => item.id === id ? { ...item, pagesRead: safePages } : item));
    return true;
  }, [user]);

  const clearActiveReread = useCallback(async (id: string) => {
    if (!user) return false;
    const { error } = await db.from("active_rereads").delete().eq("id", id).eq("user_id", user.id);
    if (error) return false;
    setActiveRereads((current) => current.filter((item) => item.id !== id));
    return true;
  }, [user]);

  return { activeRereads, loading, startReread, updatePages, clearActiveReread, refetch: fetchActiveReread };
}
