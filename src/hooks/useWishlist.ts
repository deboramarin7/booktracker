import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from("wishlist")
      .select("*")
      .order("added_at", { ascending: false });

    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error cargando wishlist", description: error.message, variant: "destructive" });
    } else {
      setItems((data as DbWish[]).map(dbToWish));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (data: Omit<WishItem, "id">) => {
    const { data: inserted, error } = await supabase.from("wishlist").insert({
      user_id: user?.id || null,
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
    const query = supabase.from("wishlist").update({
      title: data.title,
      author: data.author,
      cover_url: data.coverUrl || null,
      priority: data.priority,
      total_pages: data.totalPages || 0,
      notes: wishToExtra(data),
    }).eq("id", id).select().single();

    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }

    const { data: updated, error } = await query;

    if (error) {
      toast({ title: "Error actualizando", description: error.message, variant: "destructive" });
    } else if (updated) {
      setItems((prev) => prev.map((i) => (i.id === id ? dbToWish(updated as DbWish) : i)));
    }
  };

  const deleteItem = async (id: string) => {
    const query = supabase.from("wishlist").delete().eq("id", id);

    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }

    const { error } = await query;
    if (error) {
      toast({ title: "Error eliminando", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
}
