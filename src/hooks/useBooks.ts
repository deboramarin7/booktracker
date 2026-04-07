import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { TablesUpdate } from "@/integrations/supabase/types";

export type ReadingStatus = "reading" | "finished";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  hasSaga: boolean;
  saga?: string;
  sagaOrder?: string;
  genre: string;
  format: string;
  source: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  pagesRead: number;
  totalPages: number;
  rating: number;
  notes: string;
  status: ReadingStatus;
  tags: string[];
  addedAt: string;
}

interface DbBook {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  has_saga: boolean;
  saga: string | null;
  saga_order: string | null;
  genre: string;
  format: string;
  source: string;
  price: string | null;
  start_date: string | null;
  end_date: string | null;
  pages_read: number;
  total_pages: number;
  rating: number;
  notes: string;
  status: string;
  tags: string[] | null;
  added_at: string;
  created_at: string;
  updated_at: string;
}

function dbToBook(db: DbBook): Book {
  return {
    id: db.id,
    title: db.title,
    author: db.author,
    coverUrl: db.cover_url || undefined,
    hasSaga: db.has_saga,
    saga: db.saga || undefined,
    sagaOrder: db.saga_order || undefined,
    genre: db.genre,
    format: db.format,
    source: db.source,
    price: db.price || undefined,
    startDate: db.start_date || undefined,
    endDate: db.end_date || undefined,
    pagesRead: db.pages_read,
    totalPages: db.total_pages,
    rating: db.rating,
    notes: db.notes,
    status: db.status as ReadingStatus,
    tags: db.tags || [],
    addedAt: db.added_at,
  };
}

export function useBooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from("books")
      .select("*")
      .order("added_at", { ascending: false });

    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error cargando libros", description: error.message, variant: "destructive" });
    } else {
      setBooks((data as DbBook[]).map(dbToBook));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const addBook = async (data: Omit<Book, "id" | "addedAt">) => {
    const now = new Date().toISOString();
    const startDate = data.status === "reading" ? data.startDate || now.split("T")[0] : data.startDate;
    const endDate = data.status === "finished" ? data.endDate || now.split("T")[0] : data.endDate;

    const { data: inserted, error } = await supabase.from("books").insert({
      user_id: user?.id || null,
      title: data.title,
      author: data.author,
      cover_url: data.coverUrl || null,
      has_saga: data.hasSaga,
      saga: data.saga || null,
      saga_order: data.sagaOrder || null,
      genre: data.genre,
      format: data.format,
      source: data.source,
      price: data.price || null,
      start_date: startDate || null,
      end_date: endDate || null,
      pages_read: data.pagesRead,
      total_pages: data.totalPages,
      rating: data.rating,
      notes: data.notes,
      status: data.status,
      tags: data.tags || [],
    }).select().single();

    if (error) {
      toast({ title: "Error añadiendo libro", description: error.message, variant: "destructive" });
      throw error;
    } else if (inserted) {
      setBooks((prev) => [dbToBook(inserted as DbBook), ...prev]);
      // Auto-remove from wishlist when adding to library
      const deleteQuery = supabase.from("wishlist")
        .delete()
        .ilike("title", data.title.trim())
        .ilike("author", data.author.trim());

      if (user) {
        deleteQuery.eq("user_id", user.id);
      } else {
        deleteQuery.is("user_id", null);
      }

      await deleteQuery;
    }
  };

  const addBooksInBatch = async (booksData: Omit<Book, "id" | "addedAt">[]) => {
    const now = new Date().toISOString();
    const BATCH_SIZE = 50;
    const allInserted: DbBook[] = [];

    for (let i = 0; i < booksData.length; i += BATCH_SIZE) {
      const batch = booksData.slice(i, i + BATCH_SIZE);

      const booksToInsert = batch.map(data => {
        const startDate = data.status === "reading" ? data.startDate || now.split("T")[0] : data.startDate;
        const endDate = data.status === "finished" ? data.endDate || now.split("T")[0] : data.endDate;

        return {
          user_id: user?.id || null,
          title: data.title,
          author: data.author,
          cover_url: data.coverUrl || null,
          has_saga: data.hasSaga,
          saga: data.saga || null,
          saga_order: data.sagaOrder || null,
          genre: data.genre,
          format: data.format,
          source: data.source,
          price: data.price || null,
          start_date: startDate || null,
          end_date: endDate || null,
          pages_read: data.pagesRead,
          total_pages: data.totalPages,
          rating: data.rating,
          notes: data.notes,
          status: data.status,
          tags: data.tags || [],
        };
      });

      const { data: inserted, error } = await supabase
        .from("books")
        .insert(booksToInsert)
        .select();

      if (error) {
        const detailedError = `Error en lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`;
        toast({ title: "Error importando libros", description: detailedError, variant: "destructive" });
        throw new Error(detailedError);
      }

      if (inserted) {
        allInserted.push(...(inserted as DbBook[]));
      }
    }

    const newBooks = allInserted.map(dbToBook);
    setBooks((prev) => [...newBooks, ...prev]);
    return newBooks;
  };

  const updateBook = async (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => {
    const currentBook = books.find((b) => b.id === id);
    const today = new Date().toISOString().split("T")[0];

    const updateData: TablesUpdate<"books"> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.coverUrl !== undefined) updateData.cover_url = data.coverUrl || null;
    if (data.hasSaga !== undefined) updateData.has_saga = data.hasSaga;
    if (data.saga !== undefined) updateData.saga = data.saga || null;
    if (data.sagaOrder !== undefined) updateData.saga_order = data.sagaOrder || null;
    if (data.genre !== undefined) updateData.genre = data.genre;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.price !== undefined) updateData.price = data.price || null;
    if (data.startDate !== undefined) updateData.start_date = data.startDate || null;
    if (data.endDate !== undefined) updateData.end_date = data.endDate || null;
    if (data.pagesRead !== undefined) updateData.pages_read = data.pagesRead;
    if (data.totalPages !== undefined) updateData.total_pages = data.totalPages;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // Auto-set dates
    if (data.status === "reading" && currentBook?.status !== "reading" && !data.startDate) {
      updateData.start_date = today;
    }
    if (data.status === "finished" && currentBook?.status !== "finished" && !data.endDate) {
      updateData.end_date = today;
    }
    if (data.status === "finished" && currentBook) {
      updateData.pages_read = data.totalPages ?? currentBook.totalPages;
    }

    const query = supabase
      .from("books")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }

    const { data: updated, error } = await query;

    if (error) {
      toast({ title: "Error actualizando libro", description: error.message, variant: "destructive" });
    } else if (updated) {
      setBooks((prev) => prev.map((b) => (b.id === id ? dbToBook(updated as DbBook) : b)));
    }
  };

  const deleteBook = async (id: string) => {
    const query = supabase.from("books").delete().eq("id", id);

    if (user) {
      query.eq("user_id", user.id);
    } else {
      query.is("user_id", null);
    }

    const { error } = await query;
    if (error) {
      toast({ title: "Error eliminando libro", description: error.message, variant: "destructive" });
    } else {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return { books, loading, addBook, addBooksInBatch, updateBook, deleteBook, refetch: fetchBooks };
}
