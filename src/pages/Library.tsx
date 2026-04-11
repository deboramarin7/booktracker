import { useState, useMemo, useRef } from "react";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ImportBooksDialog } from "@/components/ImportExportBooks";
import { useWishlist, type WishItem } from "@/hooks/useWishlist";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Pencil, Check, Target, LayoutGrid, List } from "lucide-react";
import type { Book, ReadingStatus } from "@/hooks/useBooks";
import { GENRES, FORMATS, STATUSES } from "@/lib/constants";

const GOALS_KEY = "book-tracker-reading-goals";
function loadGoals(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}"); } catch { return {}; }
}
function saveGoals(goals: Record<number, number>) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function getBookYear(book: Book): number {
  const dateStr = book.endDate || book.startDate || book.addedAt;
  if (!dateStr) return new Date().getFullYear();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

type SortOption = "read-desc" | "read-asc" | "added-desc" | "added-asc" | "title-asc" | "title-desc" | "rating-desc" | "author-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "read-desc", label: "Leídos recientemente" },
  { value: "read-asc", label: "Leídos antes" },
  { value: "added-desc", label: "Añadidos recientemente" },
  { value: "added-asc", label: "Añadidos antes" },
  { value: "title-asc", label: "Título A-Z" },
