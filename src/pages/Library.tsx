import { useState, useMemo, useRef } from "react";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ImportBooksDialog, ExportBooksButton } from "@/components/ImportExportBooks";
import { useWishlist, type WishItem } from "@/hooks/useWishlist";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Pencil, Check, LayoutGrid, AlignJustify } from "lucide-react";
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

export default function Library() {
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

    if (genreFilter !== "all") {
      result = result.filter((b) => b.genre === genreFilter);
    }
    if (formatFilter !== "all") {
      result = result.filter((b) => b.format === formatFilter);
    }

    result.sort((a, b) => {
      switch (sort) {
        case "read-desc": {
          const aDate = a.endDate || a.startDate || a.addedAt;
          const bDate = b.endDate || b.startDate || b.addedAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        case "read-asc": {
          const aDate = a.endDate || a.startDate || a.addedAt;
          const bDate = b.endDate || b.startDate || b.addedAt;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        }
        case "added-desc":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case "added-asc":
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "rating-desc":
          return b.rating - a.rating;
        case "author-asc":
          return a.author.localeCompare(b.author);
        default:
          return 0;
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
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold">Mi Biblioteca</h1>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-8 w-24 text-sm font-medium border-border/50">
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
          <div className="flex items-center border border-border/40 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1.5 transition-colors ${viewMode === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("spine")}
              className={`px-2.5 py-1.5 transition-colors ${viewMode === "spine" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista lomos"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>
          <ImportBooksDialog onImport={addBooksInBatch} onImportWishlist={handleImportWishlist} />
          <ExportBooksButton books={books} />
          <AddBookDialog onAdd={addBook} onAddToWishlist={addItem} />
        </div>
      </div>

      {/* ── STATS RÁPIDAS ── */}
      {!loading && yearBooks.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{finishedYearBooks.length}</span> libros leídos
          </span>
          <span>·</span>
          <span>
            <span className="font-semibold text-foreground">{totalPages.toLocaleString()}</span> páginas
          </span>
          {totalSpent > 0 && (
            <>
              <span>·</span>
              <span>
                <span className="font-semibold text-foreground">{totalSpent.toFixed(2)}€</span> gastos
              </span>
            </>
          )}
          {physicalCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-base leading-none">📕</span>
                <span className="font-semibold text-foreground">{physicalCount}</span>
                <span>físico</span>
              </span>
            </>
          )}
          {digitalCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-base leading-none">📱</span>
                <span className="font-semibold text-foreground">{digitalCount}</span>
                <span>digital</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* ── OBJETIVO ANUAL ── */}
      {selectedYear && (
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold">Objetivo Anual {selectedYear}</span>
            </div>
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  ref={goalInputRef}
                  type="number"
                  min={0}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGoalSave();
                    if (e.key === "Escape") setEditingGoal(false);
                  }}
                  className="w-20 h-7 text-sm px-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                />
                <button
                  onClick={handleGoalSave}
                  className="h-7 px-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoalEdit}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs border border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                {currentGoal > 0 ? "Editar" : "Fijar objetivo"}
              </button>
            )}
          </div>

          {currentGoal > 0 ? (
            <>
              <div className="flex items-end gap-6 mb-3">
                <div>
                  <p className="text-3xl font-bold font-display text-foreground">{finishedYearBooks.length}</p>
                  <p className="text-xs text-muted-foreground">Libros leídos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-display text-muted-foreground">{currentGoal}</p>
                  <p className="text-xs text-muted-foreground">Objetivo</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold font-display text-emerald-500">{goalPercent}%</p>
                  {finishedYearBooks.length >= currentGoal && (
                    <p className="text-xs text-emerald-500 font-medium">Completado!</p>
                  )}
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin objetivo definido. Haz clic en "Fijar objetivo" para establecer cuántos libros quieres leer este año.
            </p>
          )}
        </div>
      )}

      {/* ── FILTROS ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-[150px] h-8 text-sm">
            <SelectValue placeholder="Género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los géneros</SelectItem>
            {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los formatos</SelectItem>
            {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[190px] h-8 text-sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {(genreFilter !== "all" || formatFilter !== "all") && (
          <button
            onClick={() => { setGenreFilter("all"); setFormatFilter("all"); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── CONTENIDO ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-primary/40" />
            </div>
            <div className="absolute -top-1 -right-1 text-xl">✨</div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-semibold font-display text-foreground">
              {books.length === 0 ? "Tu historia empieza aquí" : "Ningún libro coincide"}
            </p>
            <p className="text-sm text-muted-foreground font-display max-w-xs mx-auto">
              {books.length === 0
                ? "Cada gran biblioteca empezó con un único libro. ¿Cuál será el tuyo?"
                : "Prueba a cambiar los filtros o el año seleccionado"}
            </p>
          </div>
          {books.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-display">
              <span>💡</span>
              <span>Puedes importar desde Goodreads o añadir libros uno a uno</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByStatus.map(({ status, label, books: groupBooks }) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-foreground">{label}</h2>
                <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  {groupBooks.length}
                </span>
              </div>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupBooks.map((book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      index={index}
                      onUpdate={updateBook}
                      onDelete={deleteBook}
                      onMoveToWishlist={handleMoveToWishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex gap-1 overflow-x-auto pb-4 pt-1">
                  {groupBooks.map((book) => (
                    <div
                      key={book.id}
                      className="relative flex-shrink-0 w-[42px] h-[180px] rounded-sm overflow-hidden cursor-pointer group shadow-md hover:scale-105 transition-transform duration-150"
                      title={`${book.title} — ${book.author}`}
                    >
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-end justify-center pb-2 px-1"
                          style={{ background: `hsl(${Math.abs(book.title.charCodeAt(0) * 7 + book.title.charCodeAt(1) * 13) % 360}, 35%, 25%)` }}>
                          <span className="text-[8px] text-white/70 text-center leading-tight font-display" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                            {book.title}
                          </span>
                        </div>
                      )}
                      {/* Tooltip on hover */}
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

