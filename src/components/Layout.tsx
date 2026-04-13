import { useState, useMemo, useRef } from "react";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ImportBooksDialog, ExportBooksButton } from "@/components/ImportExportBooks";
import { useWishlist, type WishItem } from "@/hooks/useWishlist";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Pencil, Check, LayoutGrid, AlignJustify, Library, Target } from "lucide-react";
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
  { value: "title-desc", label: "Título Z-A" },
  { value: "rating-desc", label: "Mejor valorados" },
  { value: "author-asc", label: "Autor A-Z" },
];

const STATUS_LABELS: Record<string, string> = {
  "want-to-read": "Quiero leer",
  reading: "Leyendo",
  finished: "Terminado",
};

export default function LibraryPage() {
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
  const { addItem } = useWishlist();

  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));
  const [viewMode, setViewMode] = useState<"grid" | "spine">("grid");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("read-desc");

  const [goals, setGoals] = useState<Record<number, number>>(loadGoals);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const goalInputRef = useRef<HTMLInputElement>(null);

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    yearSet.add(currentYear);
    books.forEach((b) => yearSet.add(getBookYear(b)));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [books, currentYear]);

  const selectedYear = yearFilter === "all" ? null : Number(yearFilter);
  const currentGoal = selectedYear ? (goals[selectedYear] ?? 0) : 0;

  const handleGoalSave = () => {
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val >= 0 && selectedYear) {
      const updated = { ...goals, [selectedYear]: val };
      setGoals(updated);
      saveGoals(updated);
    }
    setEditingGoal(false);
  };

  const handleGoalEdit = () => {
    setGoalInput(String(currentGoal || ""));
    setEditingGoal(true);
    setTimeout(() => goalInputRef.current?.focus(), 0);
  };

  const handleImportWishlist = async (items: { title: string; author: string; coverUrl?: string; totalPages: number }[]) => {
    for (const item of items) {
      await addItem({
        title: item.title,
        author: item.author,
        coverUrl: item.coverUrl,
        hasSaga: false,
        genre: "",
        priority: 3,
        status: "Buscar",
        totalPages: item.totalPages,
      });
    }
  };

  const handleMoveToWishlist = async (book: Book) => {
    const wishItem: Omit<WishItem, "id"> = {
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      hasSaga: book.hasSaga,
      saga: book.saga,
      sagaOrder: book.sagaOrder,
      genre: book.genre,
      priority: 3,
      status: "Buscar",
      totalPages: book.totalPages,
    };
    await addItem(wishItem);
    await deleteBook(book.id);
  };

  const yearBooks = useMemo(() => {
    if (!selectedYear) return books;
    return books.filter((b) => getBookYear(b) === selectedYear);
  }, [books, selectedYear]);

  const finishedYearBooks = useMemo(
    () => yearBooks.filter((b) => b.status === "finished"),
    [yearBooks]
  );

  const totalPages = useMemo(() => finishedYearBooks.reduce((s, b) => s + b.totalPages, 0), [finishedYearBooks]);

  const totalSpent = useMemo(() => {
    return finishedYearBooks.reduce((s, b) => {
      const p = parseFloat(b.price || "0");
      return s + (isNaN(p) ? 0 : p);
    }, 0);
  }, [finishedYearBooks]);

  const physicalCount = useMemo(() => finishedYearBooks.filter((b) => b.format === "Físico").length, [finishedYearBooks]);
  const digitalCount = useMemo(() => finishedYearBooks.filter((b) => b.format === "Digital").length, [finishedYearBooks]);

  const filtered = useMemo(() => {
    let result = [...yearBooks];
    if (genreFilter !== "all") result = result.filter((b) => b.genre === genreFilter);
    if (formatFilter !== "all") result = result.filter((b) => b.format === formatFilter);

    result.sort((a, b) => {
      switch (sort) {
        case "read-desc": return new Date(b.endDate || b.startDate || b.addedAt).getTime() - new Date(a.endDate || a.startDate || a.addedAt).getTime();
        case "read-asc": return new Date(a.endDate || a.startDate || a.addedAt).getTime() - new Date(b.endDate || b.startDate || b.addedAt).getTime();
        case "added-desc": return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case "added-asc": return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case "title-asc": return a.title.localeCompare(b.title);
        case "title-desc": return b.title.localeCompare(a.title);
        case "rating-desc": return b.rating - a.rating;
        case "author-asc": return a.author.localeCompare(b.author);
        default: return 0;
      }
    });
    return result;
  }, [yearBooks, genreFilter, formatFilter, sort]);

  const groupedByStatus = useMemo(() => {
    const groups: { status: ReadingStatus; label: string; books: Book[] }[] = [];
    const statuses: ReadingStatus[] = ["finished", "reading", "want-to-read"];
    for (const s of statuses) {
      const booksInGroup = filtered.filter((b) => b.status === s);
      if (booksInGroup.length > 0) {
        groups.push({ status: s, label: STATUS_LABELS[s] ?? s, books: booksInGroup });
      }
    }
    return groups;
  }, [filtered]);

  const goalPercent = currentGoal > 0 ? Math.min(100, Math.round((finishedYearBooks.length / currentGoal) * 100)) : 0;

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl sm:text-4xl tracking-tighter font-light font-display flex items-center gap-3">
            <Library className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
            📚 Mi Biblioteca
          </h1>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-9 w-28 text-sm font-medium rounded-[var(--radius)] border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border/40 rounded-[var(--radius)] overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("spine")}
              className={`px-3 py-2 transition-colors ${viewMode === "spine" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>
          <ImportBooksDialog onImport={addBooksInBatch} onImportWishlist={handleImportWishlist} />
          <ExportBooksButton books={books} />
          <AddBookDialog onAdd={addBook} onAddToWishlist={addItem} />
        </div>
      </div>

      {/* STATS */}
      {!loading && yearBooks.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span><span className="text-lg font-semibold text-foreground">{finishedYearBooks.length}</span> libros leídos</span>
          <span className="text-border">·</span>
          <span><span className="text-lg font-semibold text-foreground">{totalPages.toLocaleString()}</span> páginas</span>
          {totalSpent > 0 && (<><span className="text-border">·</span><span><span className="text-lg font-semibold text-foreground">{totalSpent.toFixed(2)}€</span> gastos</span></>)}
          {physicalCount > 0 && (<><span className="text-border">·</span><span className="flex items-center gap-1.5"><span className="text-base leading-none">📕</span><span className="text-lg font-semibold text-foreground">{physicalCount}</span> físico</span></>)}
          {digitalCount > 0 && (<><span className="text-border">·</span><span className="flex items-center gap-1.5"><span className="text-base leading-none">📱</span><span className="text-lg font-semibold text-foreground">{digitalCount}</span> digital</span></>)}
        </div>
      )}

      {/* OBJETIVO ANUAL */}
      {selectedYear && (
        <div className="rounded-[var(--radius)] border border-border/40 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold font-body">Objetivo Anual {selectedYear}</span>
            </div>
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  ref={goalInputRef}
                  type="number"
                  min={0}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGoalSave(); if (e.key === "Escape") setEditingGoal(false); }}
                  className="w-20 h-8 text-sm px-2 rounded-[var(--radius)] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0"
                />
                <button onClick={handleGoalSave} className="h-8 px-3 rounded-[var(--radius)] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={handleGoalEdit} className="flex items-center gap-2 h-8 px-3 rounded-[var(--radius)] text-sm border border-border/50 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
                {currentGoal > 0 ? "Editar" : "Fijar objetivo"}
              </button>
            )}
          </div>
          {currentGoal > 0 ? (
            <>
              <div className="flex items-end gap-8 mb-4">
                <div>
                  <p className="text-4xl font-light tracking-tighter font-display text-foreground">{finishedYearBooks.length}</p>
                  <p className="text-sm text-muted-foreground">Libros leídos</p>
                </div>
                <div>
                  <p className="text-4xl font-light tracking-tighter font-display text-muted-foreground/60">{currentGoal}</p>
                  <p className="text-sm text-muted-foreground">Objetivo</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-light tracking-tighter font-display text-primary">{goalPercent}%</p>
                  {finishedYearBooks.length >= currentGoal && <p className="text-sm text-primary font-medium">¡Completado!</p>}
                </div>
              </div>
              <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${goalPercent}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin objetivo definido. Haz clic en "Fijar objetivo" para establecer cuántos libros quieres leer este año.</p>
          )}
        </div>
      )}

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm rounded-[var(--radius)]"><SelectValue placeholder="Género" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los géneros</SelectItem>
            {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[150px] h-9 text-sm rounded-[var(--radius)]"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los formatos</SelectItem>
            {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[200px] h-9 text-sm rounded-[var(--radius)]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {(genreFilter !== "all" || formatFilter !== "all") && (
          <button onClick={() => { setGenreFilter("all"); setFormatFilter("all"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Limpiar filtros ✕
          </button>
        )}
      </div>

      {/* LIBROS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-[var(--radius)]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="w-28 h-28 rounded-[var(--radius)] bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-light font-display text-foreground tracking-tight">
              {books.length === 0 ? "Tu historia empieza aquí" : "Ningún libro coincide"}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {books.length === 0 ? "Cada gran biblioteca empezó con un único libro. ¿Cuál será el tuyo?" : "Prueba a cambiar los filtros o el año seleccionado"}
            </p>
          </div>
          {books.length === 0 && <p className="text-xs text-muted-foreground/60">💡 Puedes importar desde Goodreads o añadir libros uno a uno</p>}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedByStatus.map(({ status, label, books: groupBooks }) => (
            <div key={status}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-semibold font-body text-foreground">{label}</h2>
                <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-medium">{groupBooks.length}</span>
              </div>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupBooks.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} onUpdate={updateBook} onDelete={deleteBook} onMoveToWishlist={handleMoveToWishlist} />
                  ))}
                </div>
              ) : (
                <div className="flex gap-1.5 overflow-x-auto pb-4 pt-1">
                  {groupBooks.map((book) => (
                    <div key={book.id} className="relative flex-shrink-0 w-[44px] h-[190px] rounded-sm overflow-hidden cursor-pointer group shadow-md hover:scale-105 transition-transform duration-150 book-3d" title={`${book.title} — ${book.author}`}>
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-end justify-center pb-2 px-1"
                          style={{ background: `hsl(${Math.abs(book.title.charCodeAt(0) * 7 + book.title.charCodeAt(1) * 13) % 360}, 35%, 25%)` }}>
                          <span className="text-[8px] text-white/70 text-center leading-tight font-display" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{book.title}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
