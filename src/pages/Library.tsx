import { useState, useMemo, useCallback } from "react";
import { useBooksContext } from "@/components/Layout";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ImportBooksDialog } from "@/components/ImportExportBooks";
import { BookCard } from "@/components/BookCard";
import { BookOpen, Search, Target, Pencil, Loader as Loader2, Download, LayoutGrid, BookMarked, Filter, X } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENRES, FORMATS, GENRE_COLORS } from "@/lib/constants";
import { EditBookDialog } from "@/components/EditBookDialog";
import type { Book } from "@/hooks/useBooks";

function getYearFromBook(book: { endDate?: string; startDate?: string; addedAt: string }): number {
  const dateStr = book.endDate || book.startDate || book.addedAt;
  if (!dateStr) return new Date().getFullYear();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

const GOALS_KEY = "book-tracker-goals";

function getGoals(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}"); } catch { return {}; }
}
function setGoalForYear(year: number, goal: number) {
  const goals = getGoals();
  goals[year] = goal;
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// Spine colors based on genre
const SPINE_COLORS: Record<string, { bg: string; text: string }> = {
  "Contemporáneo": { bg: "hsl(200,60%,45%)", text: "white" },
  "Fantasía": { bg: "hsl(270,50%,50%)", text: "white" },
  "Ficción": { bg: "hsl(30,70%,50%)", text: "white" },
  "Romántica": { bg: "hsl(340,65%,55%)", text: "white" },
  "Romantasy": { bg: "hsl(300,45%,50%)", text: "white" },
  "Sport Romance": { bg: "hsl(15,75%,50%)", text: "white" },
  "Thriller": { bg: "hsl(0,0%,25%)", text: "white" },
};

type ViewMode = "cards" | "shelf";

export default function Library() {
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook, addWishItem } = useBooksContext();
  const { addItem: addToWishlist } = useWishlist();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterSaga, setFilterSaga] = useState<string>("all");
  const [shelfEditBook, setShelfEditBook] = useState<Book | null>(null);

  const handleMoveToWishlist = useCallback(async (book: Book) => {
    await addToWishlist({
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
    });
    await deleteBook(book.id);
    toast({ title: "Libro movido a Quiero leer", description: `"${book.title}" se ha movido a tu lista de deseos.` });
  }, [addToWishlist, deleteBook, toast]);

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearSet.add(currentYear);
    books.forEach((b) => yearSet.add(getYearFromBook(b)));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [books]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear = selectedYear ?? years[0];

  const [goals, setGoals] = useState<Record<number, number>>(getGoals);
  const yearGoal = goals[activeYear] || 0;
  const booksInYear = books.filter((b) => getYearFromBook(b) === activeYear);
  const finishedInYear = booksInYear.filter((b) => b.status === "finished").length;
  const pagesInYear = booksInYear.filter((b) => b.status === "finished").reduce((s, b) => s + b.pagesRead, 0);
  const spentInYear = booksInYear.filter((b) => b.source === "Comprado" && b.price).reduce((s, b) => s + parseFloat(b.price || "0"), 0);
  const physicalInYear = booksInYear.filter((b) => b.status === "finished" && b.format === "Físico").length;
  const digitalInYear = booksInYear.filter((b) => b.status === "finished" && b.format === "Digital").length;
  const goalPercent = yearGoal > 0 ? Math.min(Math.round((finishedInYear / yearGoal) * 100), 100) : 0;

  // Available sagas for filter
  const availableSagas = useMemo(() => {
    const sagas = new Set<string>();
    booksInYear.filter(b => b.hasSaga && b.saga).forEach(b => sagas.add(b.saga!));
    return Array.from(sagas).sort();
  }, [booksInYear]);

  const activeFilters = [filterGenre, filterFormat, filterRating, filterSaga].filter(f => f !== "all").length;

  const handleSaveGoal = () => {
    const val = parseInt(goalInput);
    if (!isNaN(val) && val >= 0) {
      setGoalForYear(activeYear, val);
      setGoals(getGoals());
    }
    setEditingGoal(false);
  };

  const clearFilters = () => {
    setFilterGenre("all");
    setFilterFormat("all");
    setFilterRating("all");
    setFilterSaga("all");
  };

  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => getYearFromBook(b) === activeYear)
      .filter((b) =>
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        (b.saga && b.saga.toLowerCase().includes(search.toLowerCase()))
      )
      .filter((b) => filterGenre === "all" || b.genre === filterGenre)
      .filter((b) => filterFormat === "all" || b.format === filterFormat)
      .filter((b) => {
        if (filterRating === "all") return true;
        const r = parseInt(filterRating);
        return b.rating === r;
      })
      .filter((b) => {
        if (filterSaga === "all") return true;
        if (filterSaga === "__individual") return !b.hasSaga;
        return b.saga === filterSaga;
      })
      .sort((a, b) => {
        const dateA = a.endDate || a.startDate || a.addedAt;
        const dateB = b.endDate || b.startDate || b.addedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [books, activeYear, search, filterGenre, filterFormat, filterRating, filterSaga]);

  const exportToCSV = () => {
    const headers = ["Título", "Autor/a", "Estado", "Saga", "Orden", "Género", "Formato", "Procedencia", "Precio", "Fecha inicio", "Fecha fin", "Páginas leídas", "Páginas totales", "Puntuación"];
    const rows = filteredBooks.map(b => [
      b.title, b.author, b.status === "finished" ? "Terminado" : "Leyendo",
      b.saga || "", b.sagaOrder || "", b.genre, b.format, b.source, b.price || "",
      b.startDate || "", b.endDate || "", b.pagesRead, b.totalPages, b.rating
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblioteca_${activeYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reading = filteredBooks.filter((b) => b.status === "reading");
  const finished = filteredBooks.filter((b) => b.status === "finished");

  const Section = ({ title, emoji, items }: { title: string; emoji: string; items: typeof filteredBooks }) => (
    items.length > 0 ? (
      <section>
        <h3 className="text-lg font-display font-medium mb-3 flex items-center gap-2">
          {emoji} {title} <span className="text-sm text-muted-foreground">({items.length})</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((book, i) => (
            <BookCard key={book.id} book={book} onUpdate={updateBook} onDelete={deleteBook} onMoveToWishlist={handleMoveToWishlist} index={i} />
          ))}
        </div>
      </section>
    ) : null
  );

  // Shelf view component
  const ShelfView = ({ items }: { items: typeof filteredBooks }) => (
    <div className="space-y-8">
      {items.length > 0 && (
        <div className="relative">
          {/* Shelf */}
          <div className="flex flex-wrap gap-1 items-end pb-3 min-h-[180px] px-2">
            {items.map((book) => {
              const spineColor = SPINE_COLORS[book.genre] || { bg: "hsl(220,15%,40%)", text: "white" };
              const height = Math.max(120, Math.min(200, 100 + (book.totalPages / 5)));
              return (
                <button
                  key={book.id}
                  onClick={() => setShelfEditBook(book)}
                  className="group relative transition-transform hover:-translate-y-2 hover:z-10 focus:outline-none focus:-translate-y-2"
                  title={`${book.title} — ${book.author}`}
                  style={{ height: `${height}px` }}
                >
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-10 sm:w-12 object-cover rounded-sm shadow-md border border-black/10"
                      style={{ writingMode: "vertical-rl" }}
                    />
                  ) : (
                    <div
                      className="h-full w-10 sm:w-12 rounded-sm shadow-md flex items-center justify-center border border-black/10"
                      style={{ backgroundColor: spineColor.bg, color: spineColor.text }}
                    >
                      <span
                        className="text-[9px] font-bold tracking-wide whitespace-nowrap overflow-hidden max-w-[90%]"
                        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                      >
                        {book.title.length > 20 ? book.title.slice(0, 20) + "…" : book.title}
                      </span>
                    </div>
                  )}
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-40">
                    <div className="bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border text-center">
                      <p className="font-semibold truncate">{book.title}</p>
                      <p className="text-muted-foreground truncate">{book.author}</p>
                      {book.rating > 0 && <p className="text-amber-500 mt-0.5">{"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Shelf board */}
          <div className="h-3 bg-gradient-to-b from-amber-800 to-amber-900 dark:from-amber-900 dark:to-amber-950 rounded-sm shadow-md" />
          <div className="h-1 bg-amber-950/30 dark:bg-amber-950/50 rounded-b-sm" />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-semibold">Mi Biblioteca</h2>
          <Select value={String(activeYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px] font-body h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setViewMode("cards")}
              title="Vista tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "shelf" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setViewMode("shelf")}
              title="Vista estantería"
            >
              <BookMarked className="h-4 w-4" />
            </Button>
          </div>
          <ImportBooksDialog onImport={addBooksInBatch} />
          <Button variant="outline" size="sm" onClick={exportToCSV} title="Exportar a CSV">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Exportar</span>
          </Button>
          <AddBookDialog onAdd={addBook} onAddToWishlist={addWishItem} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-body">
        <span><span className="font-semibold text-foreground">{finishedInYear}</span> libros leídos</span>
        <span>·</span>
        <span><span className="font-semibold text-foreground">{pagesInYear.toLocaleString()}</span> páginas</span>
        <span>·</span>
        <span><span className="font-semibold text-foreground">{spentInYear.toFixed(2)}€</span> gastos</span>
        <span>·</span>
        <span>📕 <span className="font-semibold text-foreground">{physicalInYear}</span> físico</span>
        <span>📱 <span className="font-semibold text-foreground">{digitalInYear}</span> digital</span>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Objetivo Anual {activeYear}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditingGoal(true); setGoalInput(String(yearGoal || "")); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          {editingGoal ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Nº de libros"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-32 font-body"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveGoal()}
              />
              <Button size="sm" onClick={handleSaveGoal}>Guardar</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingGoal(false)}>Cancelar</Button>
            </div>
          ) : yearGoal > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-body">
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{finishedInYear}</p>
                    <p className="text-xs text-muted-foreground">Libros leídos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{yearGoal}</p>
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{goalPercent}%</p>
                </div>
              </div>
              <Progress value={goalPercent} className="h-3" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body">
              Haz clic en el lápiz para establecer tu objetivo de lectura para {activeYear}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título, autor o saga..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-body" />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilters > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-card animate-fade-in">
            <div className="space-y-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Género</label>
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[120px]">
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[120px]">
              <label className="text-xs font-medium text-muted-foreground">Puntuación</label>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{"★".repeat(r)}{"☆".repeat(5 - r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Saga</label>
              <Select value={filterSaga} onValueChange={setFilterSaga}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="__individual">Individual</SelectItem>
                  {availableSagas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {activeFilters > 0 && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
                  <X className="h-3 w-3" /> Limpiar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {viewMode === "cards" ? (
        <>
          <Section title="Leyendo" emoji="📖" items={reading} />
          <Section title="Terminados" emoji="✅" items={finished} />
        </>
      ) : (
        <>
          {reading.length > 0 && (
            <section>
              <h3 className="text-lg font-display font-medium mb-3 flex items-center gap-2">
                📖 Leyendo <span className="text-sm text-muted-foreground">({reading.length})</span>
              </h3>
              <ShelfView items={reading} />
            </section>
          )}
          {finished.length > 0 && (
            <section>
              <h3 className="text-lg font-display font-medium mb-3 flex items-center gap-2">
                ✅ Terminados <span className="text-sm text-muted-foreground">({finished.length})</span>
              </h3>
              <ShelfView items={finished} />
            </section>
          )}
        </>
      )}

      {filteredBooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground font-display">No hay libros en {activeYear}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Añade tu primer libro para empezar</p>
        </div>
      )}

      {shelfEditBook && (
        <EditBookDialog
          book={shelfEditBook}
          open={!!shelfEditBook}
          onOpenChange={(open) => !open && setShelfEditBook(null)}
          onSave={updateBook}
        />
      )}
    </div>
  );
}
