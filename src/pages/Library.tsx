import { useState, useMemo } from "react";
import { useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import { AddBookDialog } from "@/components/AddBookDialog";
import { ImportBooksDialog } from "@/components/ImportExportBooks";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useWishlist, type WishItem } from "@/hooks/useWishlist";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Library as LibraryIcon } from "lucide-react";
import type { Book, ReadingStatus } from "@/hooks/useBooks";
import { GENRES, FORMATS, STATUSES } from "@/lib/constants";

type SortOption = "added-desc" | "added-asc" | "title-asc" | "title-desc" | "rating-desc" | "author-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "added-desc", label: "Añadidos recientemente" },
  { value: "added-asc", label: "Añadidos antes" },
  { value: "title-asc", label: "Título A-Z" },
  { value: "title-desc", label: "Título Z-A" },
  { value: "rating-desc", label: "Mejor valorados" },
  { value: "author-asc", label: "Autor A-Z" },
];

export default function Library() {
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
  const { addItem } = useWishlist();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("added-desc");

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

  const filtered = useMemo(() => {
    let result = [...books];

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (genreFilter !== "all") {
      result = result.filter((b) => b.genre === genreFilter);
    }
    if (formatFilter !== "all") {
      result = result.filter((b) => b.format === formatFilter);
    }

    result.sort((a, b) => {
      switch (sort) {
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
  }, [books, statusFilter, genreFilter, formatFilter, sort]);

  const counts = useMemo(() => ({
    all: books.length,
    "want-to-read": books.filter((b) => b.status === "want-to-read").length,
    reading: books.filter((b) => b.status === "reading").length,
    finished: books.filter((b) => b.status === "finished").length,
  }), [books]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LibraryIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold">Mi Biblioteca</h1>
            <p className="text-sm text-muted-foreground">{books.length} libros en total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlobalSearch books={books} />
          <ImportBooksDialog onImport={addBooksInBatch} onImportWishlist={handleImportWishlist} />
          <AddBookDialog onAdd={addBook} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ value: "all", label: `Todos (${counts.all})` }, ...STATUSES.map(s => ({ value: s.value, label: `${s.label} (${counts[s.value as ReadingStatus] ?? 0})` }))].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

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

        {(statusFilter !== "all" || genreFilter !== "all" || formatFilter !== "all") && (
          <button
            onClick={() => { setStatusFilter("all"); setGenreFilter("all"); setFormatFilter("all"); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {books.length === 0 ? "Tu biblioteca está vacía" : "No hay libros con estos filtros"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {books.length === 0 ? "Añade tu primer libro para empezar" : "Prueba a cambiar los filtros"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book, index) => (
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
      )}
    </div>
  );
}
