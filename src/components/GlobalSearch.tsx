import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Book } from "@/hooks/useBooks";

interface GlobalSearchProps {
  books: Book[];
  onSelectBook?: (book: Book) => void;
}

export function GlobalSearch({ books, onSelectBook }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return books
      .filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, books]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
        title="Buscar (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar libro o autor..."
            className="w-48 sm:w-64 pl-8 pr-8 h-8 text-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setOpen(false); setQuery(""); }} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {query.trim() && (
        <div className="absolute top-full mt-1 right-0 w-72 sm:w-80 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Sin resultados</div>
          ) : (
            results.map((book) => (
              <button
                key={book.id}
                onClick={() => {
                  onSelectBook?.(book);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left border-b last:border-b-0"
              >
                <BookCoverImage
                  src={book.coverUrl}
                  className="w-8 h-12 object-cover rounded-sm shrink-0"
                  fallbackClassName="w-8 h-12 rounded-sm shrink-0"
                  iconClassName="h-3 w-3"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {book.status === "finished" ? "Terminado" : "Leyendo"} 
                    {book.rating > 0 && ` · ${"★".repeat(book.rating)}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
