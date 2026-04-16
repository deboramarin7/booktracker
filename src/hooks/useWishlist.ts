import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

async function fetchCoverForBook(title: string, author: string): Promise<string | null> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-books`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ query: title, title, author }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.books?.[0]?.coverUrl || null;
  } catch {
    return null;
  }
}

export type WishStatus = "Comprado" | "Buscar" | "En biblioteca" | "En kindle";

export interface WishItem {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  hasSaga: boolean;
  saga?: string;
  sagaOrder?: string;
  genre: string;
  priority: number;
  synopsis?: string;
  status: WishStatus;
  totalPages: number;
}

interface DbWish {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  priority: number;
  notes: string;
  total_pages: number;
  added_at: string;
  created_at: string;
  updated_at: string;
}

// We store saga/genre/status info in the notes field as JSON since the DB table is simpler
// Actually let's use the notes field to store the extra fields as JSON
interface ExtraFields {
  hasSaga?: boolean;
  saga?: string;
  sagaOrder?: string;
  genre?: string;
  wishStatus?: WishStatus;
}

function dbToWish(db: DbWish): WishItem {
  let extra: ExtraFields = {};
  try { extra = JSON.parse(db.notes || "{}"); } catch {}
  return {
    id: db.id,
    title: db.title,
    author: db.author,
    coverUrl: db.cover_url || undefined,
    hasSaga: extra.hasSaga || false,
    saga: extra.saga,
    sagaOrder: extra.sagaOrder,
    genre: extra.genre || "",
    priority: db.priority,
    status: extra.wishStatus || "Buscar",
    totalPages: db.total_pages || 0,
  };
}

function wishToExtra(item: Omit<WishItem, "id">): string {
  return JSON.stringify({
    hasSaga: item.hasSaga,
    saga: item.saga,
    sagaOrder: item.sagaOrder,
    genre: item.genre,
    wishStatus: item.status,
  });
}

export function useWishlist() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const { toast } = useToast();
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const enrichingRef = useRef(false);

  const enrichMissingCovers = useCallback(async (loadedItems: WishItem[]) => {
    if (enrichingRef.current) return;
    const missing = loadedItems.filter((i) => !i.coverUrl);
    if (!missing.length) return;
    enrichingRef.current = true;

    for (const item of missing) {
      const cover = await fetchCoverForBook(item.title, item.author);
      if (cover) {
        await supabase
          .from("wishlist")
          .update({ cover_url: cover })
          .eq("id", item.id)
          .eq("user_id", userId);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, coverUrl: cover } : i))
        );
      }
    }

    enrichingRef.current = false;
  }, []);

  const fetchItems = useCallback(async () => {
  if (!userId) {
    setItems([]);
    setLoading(false);
    return;
  }
  setLoading(true);
  const { data, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) {
      toast({ title: "Error cargando wishlist", description: error.message, variant: "destructive" });
    } else {
      const loaded = (data as DbWish[]).map(dbToWish);
      setItems(loaded);
      enrichMissingCovers(loaded);
    }
    setLoading(false);
  }, [toast, enrichMissingCovers, userId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (data: Omit<WishItem, "id">) => {
    if (!userId) return;  // ← AÑADE ESTA LÍNEA
    const { data: inserted, error } = await supabase.from("wishlist").insert({
      user_id: userId,
      title: data.title,
      author: data.author,
      cover_url: data.coverUrl || null,
      priority: data.priority,
      total_pages: data.totalPages || 0,
      notes: wishToExtra(data),
    }).select().single();

    if (error) {
      toast({ title: "Error añadiendo a wishlist", description: error.message, variant: "destructive" });
    } else if (inserted) {
      setItems((prev) => [dbToWish(inserted as DbWish), ...prev]);
    }
  };

  const updateItem = async (id: string, data: Omit<WishItem, "id">) => {
    const { data: updated, error } = await supabase.from("wishlist").update({
      title: data.title,
      author: data.author,
      cover_url: data.coverUrl || null,
      priority: data.priority,
      total_pages: data.totalPages || 0,
      notes: wishToExtra(data),
    }).eq("id", id).eq("user_id", userId).select().single();

    if (error) {
      toast({ title: "Error actualizando", description: error.message, variant: "destructive" });
    } else if (updated) {
      setItems((prev) => prev.map((i) => (i.id === id ? dbToWish(updated as DbWish) : i)));
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Error eliminando", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
}
