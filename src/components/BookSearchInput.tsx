import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

export interface GoogleBookResult {
  title: string;
  authors: string[];
  thumbnail: string | null;
  pageCount: number | null;
  description: string | null;
}

interface BookSearchInputProps {
  onSelect: (book: GoogleBookResult) => void;
}

async function searchBooks(query: string): Promise<GoogleBookResult[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`
  );
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    title: item.volumeInfo?.title || "",
    authors: item.volumeInfo?.authors || [],
    thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://") || null,
    pageCount: item.volumeInfo?.pageCount || null,
    description: item.volumeInfo?.description || null,
  }));
}

export function BookSearchInput({ onSelect }: BookSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchBooks(value);
        setResults(items);
        setShowResults(true);
      } catch (err) {
        console.error("Error searching books:", err);
        setResults([]);
        setShowResults(true);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const handleSelect = (book: GoogleBookResult) => {
    onSelect(book);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleBlur = () => {
    // Delay to allow click on results
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setShowResults(false);
      }
    }, 200);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar libro por título o autor..."
          className="pl-9 pr-9"
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-y-auto">
          {results.map((book, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(book)}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors border-b last:border-b-0"
            >
              {book.thumbnail ? (
                <img src={book.thumbnail} alt={book.title} className="h-14 w-10 object-cover rounded shrink-0" />
              ) : (
                <div className="h-14 w-10 bg-muted rounded shrink-0 flex items-center justify-center text-xs text-muted-foreground">?</div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{book.authors.join(", ") || "Autor desconocido"}</p>
                {book.pageCount && <p className="text-xs text-muted-foreground">{book.pageCount} páginas</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !loading && query.trim().length >= 3 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-3 text-sm text-muted-foreground text-center">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
}
