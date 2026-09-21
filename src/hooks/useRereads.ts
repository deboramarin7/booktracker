import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Reread {
  id: string;
  bookId: string;
  finishedAt: string;
  pagesRead: number;
  rating: number;
  notes: string;
}

type NewReread = Omit<Reread, "id">;
const db = supabase as any;

export function useRereads() {
  const { user } = useAuth();
  const [rereads, setRereads] = useState<Reread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRereads = useCallback(async () => {
    if (!user) {
      setRereads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await db
      .from("book_rereads")
      .select("id, book_id, finished_at, pages_read, rating, notes")
      .eq("user_id", user.id)
      .order("finished_at", { ascending: false });

    if (error) {
      console.error("Error loading rereads:", error);
      setRereads([]);
    } else {
      setRereads((data || []).map((item: any) => ({
        id: item.id,
        bookId: item.book_id,
        finishedAt: item.finished_at,
        pagesRead: item.pages_read || 0,
        rating: item.rating || 0,
        notes: item.notes || "",
      })));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchRereads();
  }, [fetchRereads]);

  const addReread = useCallback(async (reread: NewReread) => {
    if (!user) return false;

    const { data, error } = await db
      .from("book_rereads")
      .insert({
        user_id: user.id,
        book_id: reread.bookId,
        finished_at: reread.finishedAt,
        pages_read: reread.pagesRead,
        rating: reread.rating,
        notes: reread.notes || null,
      })
      .select("id, book_id, finished_at, pages_read, rating, notes")
      .single();

    if (error) {
      console.error("Error saving reread:", error);
      return false;
    }

    setRereads((previous) => [{
      id: data.id,
      bookId: data.book_id,
      finishedAt: data.finished_at,
      pagesRead: data.pages_read || 0,
      rating: data.rating || 0,
      notes: data.notes || "",
    }, ...previous]);
    return true;
  }, [user]);

  return { rereads, loading, addReread, refetch: fetchRereads };
}
