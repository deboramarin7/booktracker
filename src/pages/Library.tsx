import { useState, useMemo, useRef } from "react";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ExportBooksButton } from "@/components/ImportExportBooks";
import { useWishlist, type WishItem } from "@/hooks/useWishlist";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Pencil, Check, LayoutGrid, AlignJustify, Library, Target, Star, Image, Trash2 } from "lucide-react";
import type { Book, ReadingStatus } from "@/hooks/useBooks";
import { GENRES, FORMATS } from "@/lib/constants";
import { EditBookDialog } from "@/components/EditBookDialog";
import { BookCoverImage } from "@/components/BookCoverImage";
import { STATUS_COLORS, GENRE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  { value: "read-desc", label: "Leidos recientemente" },
  { value: "read-asc", label: "Leidos antes" },
  { value: "added-desc", label: "Anadidos recientemente" },
  { value: "added-asc", label: "Anadidos antes" },
  { value: "title-asc", label: "Titulo A-Z" },
  { value: "title-desc", label: "Titulo Z-A" },
  { value: "rating-desc", label: "Mejor valorados" },
  { value: "author-asc", label: "Autor A-Z" },
];

const STATUS_LABELS: Record<string, string> = {
  "want-to-read": "Quiero leer",
  reading: "Leyendo",
  finished: "Terminado",
};

function CoverCard({ book, onUpdate, onDelete }: { book: Book; onUpdate: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showFinishForm, setShowFinishForm] = useState(false);
  const [finishRating, setFinishRating] = useState(0);
  const [finishNotes, setFinishNotes] = useState("");

  const statusBadge = () => {
    switch (book.status) {
      case "finished":
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-200 dark:text-green-400 rounded-full backdrop-blur-sm">Terminado</span>;
      case "reading":
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-200 dark:text-blue-400 rounded-full backdrop-blur-sm">Leyendo</span>;
      case "want-to-read":
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-200 dark:text-pink-400 rounded-full backdrop-blur-sm">Quiero leer</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="group cursor-pointer" onClick={() => setShowDetail(true)}>
        <div className="aspect-[2/3] rounded-[var(--radius)] overflow-hidden bg-muted mb-2 book-3d relative">
          <BookCoverImage
            src={book.coverUrl}
            alt={book.title}
            title={book.title}
            className="w-full h-full object-cover"
            iconClassName="h-10 w-10"
          />
          <div className="absolute top-2 left-2">
            {statusBadge()}
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Eliminar "${book.title}"? Esta accion no se puede deshacer.`)) onDelete(book.id); }}
              className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <h3 className="text-sm font-semibold truncate font-body">{book.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        {book.hasSaga && book.saga && (
          <p className="text-[10px] text-primary truncate mt-0.5">
            {book.saga} #{book.sagaOrder}
          </p>
        )}
        {book.rating > 0 && (
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i <= book.rating ? "text-accent fill-accent" : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
        )}
      </div>
      {editing && (
        <EditBookDialog book={book} open={editing} onOpenChange={setEditing} onSave={onUpdate} />
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDetail(false); setShowFinishForm(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex gap-4">
              <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-md">
                <BookCoverImage src={book.coverUrl} alt={book.title} title={book.title} className="w-full h-full object-cover" iconClassName="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg font-display leading-tight text-foreground">{book.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
                {book.hasSaga && book.saga && (
                  <p className="text-xs text-primary mt-1">{book.saga} #{book.sagaOrder}</p>
                )}
                {book.rating > 0 && (
                  <div className="flex gap-0.5 mt-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-4 w-4 ${i <= book.rating ? "text-accent fill-accent" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-sm border-t border-border/40 pt-3">
              {book.genre && <><span className="text-muted-foreground">Genero</span><span className="text-foreground font-medium">{book.genre}</span></>}
              {book.format && <><span className="text-muted-foreground">Formato</span><span className="text-foreground font-medium">{book.format}</span></>}
              {book.totalPages > 0 && <><span className="text-muted-foreground">Paginas</span><span className="text-foreground font-medium">{book.totalPages}</span></>}
              {book.price && <><span className="text-muted-foreground">Precio</span><span className="text-foreground font-medium">{book.price}€</span></>}
              {book.source && <><span className="text-muted-foreground">Procedencia</span><span className="text-foreground font-medium">{book.source}</span></>}
              {(book.startDate || book.endDate) && (
                <><span className="text-muted-foreground">Fechas</span>
                <span className="text-foreground font-medium text-xs">
                  {book.startDate && new Date(book.startDate + "T12:00:00").toLocaleDateString("es-ES", {day:"2-digit",month:"2-digit",year:"2-digit"})}
                  {book.startDate && book.endDate && " -> "}
                  {book.endDate && new Date(book.endDate + "T12:00:00").toLocaleDateString("es-ES", {day:"2-digit",month:"2-digit",year:"2-digit"})}
                </span></>
              )}
            </div>
            {book.notes && (
              <div className="border-t border-border/40 pt-3">
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm text-foreground leading-relaxed">{book.notes}</p>
              </div>
            )}

            {/* Progress — solo para libros en estado "reading" */}
            {book.status === "reading" && book.totalPages > 0 && (
              <div className="border-t border-border/40 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="text-foreground font-medium">{book.pagesRead} / {book.totalPages} pag. ({Math.round((book.pagesRead / book.totalPages) * 100)}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.round((book.pagesRead / book.totalPages) * 100)}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    max={book.totalPages}
                    defaultValue={book.pagesRead}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => { e.stopPropagation(); (e.target as HTMLInputElement).select(); }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        const val = Math.min(Math.max(0, Number((e.target as HTMLInputElement).value) || 0), book.totalPages);
                        onUpdate(book.id, { pagesRead: val });
                      }
                    }}
                    onBlur={(e) => {
                      const val = Math.min(Math.max(0, Number(e.target.value) || 0), book.totalPages);
                      if (val !== book.pagesRead) onUpdate(book.id, { pagesRead: val });
                    }}
                    className="flex-1 h-9 text-sm px-3 rounded-[var(--radius)] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Paginas leidas"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/ {book.totalPages}</span>
                </div>

                {/* Marcar como terminado — con formulario de valoracion */}
                {!showFinishForm ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFinishForm(true);
                      setFinishRating(0);
                      setFinishNotes("");
                    }}
                    className="w-full h-9 rounded-[var(--radius)] bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Marcar como terminado
                  </button>
                ) : (
                  <div className="space-y-3 p-3 rounded-[var(--radius)] bg-muted/30 border border-border/40" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm font-medium text-foreground">Valoracion</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-7 w-7 cursor-pointer transition-colors",
                            i <= finishRating ? "text-accent fill-accent" : "text-muted-foreground/30 hover:text-accent/50"
                          )}
                          onClick={() => setFinishRating(i)}
                        />
                      ))}
                    </div>
                    <textarea
                      value={finishNotes}
                      onChange={(e) => setFinishNotes(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="Escribe tu resena (opcional)"
                      className="w-full h-20 text-sm px-3 py-2 rounded-[var(--radius)] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFinishForm(false)}
                        className="flex-1 h-9 rounded-[var(--radius)] border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors text-foreground"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          onUpdate(book.id, {
                            status: "finished",
                            pagesRead: book.totalPages,
                            rating: finishRating,
                            notes: finishNotes.trim() || book.notes,
                          });
                          setShowDetail(false);
                          setShowFinishForm(false);
                        }}
                        className="flex-1 h-9 rounded-[var(--radius)] bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setShowDetail(false); setShowFinishForm(false); setEditing(true); }} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-[var(--radius)] border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors text-foreground">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button onClick={() => { setShowDetail(false); setShowFinishForm(false); }} className="flex-1 h-9 rounded-[var(--radius)] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LibraryPage() {
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
  const { addItem } = useWishlist();

  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));
  const [viewMode, setViewMode] = useState<"covers" | "grid" | "spine">("covers");
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
        title: item.title, author: item.author, coverUrl: item.coverUrl,
        hasSaga: false, genre: "", priority: 3, status: "Buscar", totalPages: item.totalPages,
      });
    }
  };

  const handleMoveToWishlist = async (book: Book) => {
    const wishItem: Omit<WishItem, "id"> = {
      title: book.title, author: book.author, coverUrl: book.coverUrl,
      hasSaga: book.hasSaga, saga: book.saga, sagaOrder: book.sagaOrder,
      genre: book.genre, priority: 3, status: "Buscar", totalPages: book.totalPages,
    };
    await addItem(wishItem);
    await deleteBook(book.id);
  };

  const yearBooks = useMemo(() => {
    if (!selectedYear) return books;
    return books.filter((b) => getBookYear(b) === selectedYear);
  }, [books, selectedYear]);

  const finishedYearBooks = useMemo(() => yearBooks.filter((b) => b.status === "finished"), [yearBooks]);
  const totalPages = useMemo(() => finishedYearBooks.reduce((s, b) => s + b.totalPages, 0), [finishedYearBooks]);
  const totalSpent = useMemo(() => {
    return finishedYearBooks.reduce((s, b) => {
      const p = parseFloat(b.price || "0");
      return s + (isNaN(p) ? 0 : p);
    }, 0);
  }, [finishedYearBooks]);
  const physicalCount = useMemo(() => finishedYearBooks.filter((b) => b.format === "Fisico").length, [finishedYearBooks]);
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
    const statuses: ReadingStatus[] = ["reading", "finished", "want-to-read"];
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
      <div className="space-y-3">
        <div className="flex items-center gap-3">
           <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Mi Biblioteca
          </h2>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-8 sm:h-9 w-24 sm:w-28 text-sm font-medium rounded-[var(--radius)] border-border/50 flex-shrink-0">
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center border border-border/40 rounded-[var(--radius)] overflow-hidden flex-shrink-0">
            <button onClick={() => setViewMode("covers")}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 transition-colors ${viewMode === "covers" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista portadas">
              <Image className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 transition-colors ${viewMode === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista detalle">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("spine")}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 transition-colors ${viewMode === "spine" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista lomos">
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ExportBooksButton books={books} />
            <AddBookDialog onAdd={addBook} onAddToWishlist={addItem} />
          </div>
        </div>
      </div>

      {/* STATS */}
      {!loading && yearBooks.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span><span className="text-lg font-semibold text-foreground">{finishedYearBooks.length}</span> libros leidos</span>
          <span className="text-border/60">|</span>
          <span><span className="text-lg font-semibold text-foreground">{totalPages.toLocaleString()}</span> paginas</span>
          {totalSpent > 0 && (<><span className="text-border/60">|</span><span><span className="text-lg font-semibold text-foreground">{totalSpent.toFixed(2)}€</span> gastos</span></>)}
          {physicalCount > 0 && (<><span className="text-border/60">|</span><span><span className="text-lg font-semibold text-foreground">{physicalCount}</span> fisico</span></>)}
          {digitalCount > 0 && (<><span className="text-border/60">|</span><span><span className="text-lg font-semibold text-foreground">{digitalCount}</span> digital</span></>)}
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
                <input ref={goalInputRef} type="number" min={0} value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGoalSave(); if (e.key === "Escape") setEditingGoal(false); }}
                  className="w-20 h-8 text-sm px-2 rounded-[var(--radius)] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0" />
                <button onClick={handleGoalSave} className="h-8 px-3 rounded-[var(--radius)] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={handleGoalEdit}
                className="flex items-center gap-2 h-8 px-3 rounded-[var(--radius)] text-sm border border-border/50 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
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
                  <p className="text-sm text-muted-foreground">Libros leidos</p>
                </div>
                <div>
                  <p className="text-4xl font-light tracking-tighter font-display text-muted-foreground/60">{currentGoal}</p>
                  <p className="text-sm text-muted-foreground">Objetivo</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-light tracking-tighter font-display text-primary">{goalPercent}%</p>
                  {finishedYearBooks.length >= currentGoal && <p className="text-sm text-primary font-medium">Completado!</p>}
                </div>
              </div>
              <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${goalPercent}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin objetivo definido. Haz clic en "Fijar objetivo" para establecer cuantos libros quieres leer este ano.</p>
          )}
        </div>
      )}

      {/* FILTROS */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-center">
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm rounded-[var(--radius)]"><SelectValue placeholder="Genero" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los generos</SelectItem>
            {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm rounded-[var(--radius)]"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los formatos</SelectItem>
            {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm rounded-[var(--radius)] col-span-2 sm:col-span-1"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {(genreFilter !== "all" || formatFilter !== "all") && (
          <button onClick={() => { setGenreFilter("all"); setFormatFilter("all"); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-[var(--radius)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="w-28 h-28 rounded-[var(--radius)] bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-light font-display text-foreground tracking-tight">
              {books.length === 0 ? "Tu historia empieza aqui" : "Ningun libro coincide"}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {books.length === 0 ? "Cada gran biblioteca empezo con un unico libro." : "Prueba a cambiar los filtros o el ano seleccionado"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedByStatus.map(({ status, label, books: groupBooks }) => (
            <div key={status}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-semibold font-body text-foreground">{label}</h2>
                <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-medium">{groupBooks.length}</span>
              </div>

              {viewMode === "covers" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {groupBooks.map((book) => (
                    <CoverCard key={book.id} book={book} onUpdate={updateBook} onDelete={deleteBook} />
                  ))}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupBooks.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} onUpdate={updateBook} onDelete={deleteBook} onMoveToWishlist={handleMoveToWishlist} />
                  ))}
                </div>
              ) : (
                <div className="flex gap-1.5 overflow-x-auto pb-4 pt-1">
                  {groupBooks.map((book) => (
                    <div key={book.id}
                      className="relative flex-shrink-0 w-[44px] h-[190px] rounded-sm overflow-hidden cursor-pointer group shadow-md hover:scale-105 transition-transform duration-150 book-3d"
                      title={`${book.title} - ${book.author}`}>
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
