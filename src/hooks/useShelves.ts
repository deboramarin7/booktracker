import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Shelf {
  id: string;
  name: string;
  description: string;
  color: string;
  bookIds: string[];
}

interface DbShelf {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface DbShelfBook {
  id: string;
  shelf_id: string;
  book_id: string;
  added_at: string;
}

export function useShelves() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShelves = useCallback(async () => {
    if (!user) { setShelves([]); setLoading(false); return; }
    setLoading(true);

    const { data: shelvesData, error: shelvesError } = await supabase
      .from("shelves")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (shelvesError) {
      toast({ title: "Error cargando estanterías", description: shelvesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: booksData, error: booksError } = await supabase
      .from("shelf_books")
      .select("*");

    if (booksError) {
      toast({ title: "Error cargando libros de estanterías", description: booksError.message, variant: "destructive" });
    }

    const shelfBookMap = new Map<string, string[]>();
    (booksData as DbShelfBook[] || []).forEach((sb) => {
      const arr = shelfBookMap.get(sb.shelf_id) || [];
      arr.push(sb.book_id);
      shelfBookMap.set(sb.shelf_id, arr);
    });

    setShelves((shelvesData as DbShelf[]).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      color: s.color,
      bookIds: shelfBookMap.get(s.id) || [],
    })));
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchShelves(); }, [fetchShelves]);

  const addShelf = async (name: string, description: string, color: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("shelves").insert({
      user_id: user.id, name, description, color,
    }).select().single();

    if (error) {
      toast({ title: "Error creando estantería", description: error.message, variant: "destructive" });
    } else if (data) {
      setShelves((prev) => [...prev, { id: (data as DbShelf).id, name, description, color, bookIds: [] }]);
    }
  };

  const updateShelf = async (id: string, updates: { name?: string; description?: string; color?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("shelves").update(updates).eq("id", id).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error actualizando estantería", description: error.message, variant: "destructive" });
    } else {
      setShelves((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteShelf = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("shelves").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error eliminando estantería", description: error.message, variant: "destructive" });
    } else {
      setShelves((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const addBookToShelf = async (shelfId: string, bookId: string) => {
    const { error } = await supabase.from("shelf_books").insert({ shelf_id: shelfId, book_id: bookId });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "El libro ya está en esta estantería" });
      } else {
        toast({ title: "Error añadiendo libro", description: error.message, variant: "destructive" });
      }
    } else {
      setShelves((prev) => prev.map((s) =>
        s.id === shelfId ? { ...s, bookIds: [...s.bookIds, bookId] } : s
      ));
    }
  };

  const removeBookFromShelf = async (shelfId: string, bookId: string) => {
    const { error } = await supabase.from("shelf_books").delete()
      .eq("shelf_id", shelfId).eq("book_id", bookId);
    if (error) {
      toast({ title: "Error quitando libro", description: error.message, variant: "destructive" });
    } else {
      setShelves((prev) => prev.map((s) =>
        s.id === shelfId ? { ...s, bookIds: s.bookIds.filter((id) => id !== bookId) } : s
      ));
    }
  };

  return { shelves, loading, addShelf, updateShelf, deleteShelf, addBookToShelf, removeBookFromShelf, refetch: fetchShelves };
}
