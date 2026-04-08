import { useState, useRef } from "react";
import { Search, Loader as Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BookSearchResult {
  title: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
  genre?: string;
}

interface BookSearchGoogleProps {
  onSelect: (result: BookSearchResult) => void;
}

async function searchBooks(query: string): Promise<BookSearchResult[]> {
  try {
    const { data, error } = await supabase.functions.invoke("search-books", {
      body: { title: query },
    });
    if (error || !data?.books?.length) return [];
    return data.books.map((b: any) => ({
      title:      b.title      || "",
      author:     b.author     || "",
      coverUrl:   b.coverUrl   || undefined,
      totalPages: b.totalPages || 0,
      genre:      b.genre      || undefined,
    }));
  } catch {
    return [];
  }
}

export function BookSearchGoogle({ onSelect }: BookSearchGoogleProps) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<BookSearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const books = await searchBooks(q.trim());
      setResults(books);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar por título, autor o ISBN..."
          className="text-sm h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (debounceRef.current) clearTimeout(debounceRef.current);
              search(query);
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); search(query); }}
          disabled={loading}
          className="h-8 px-2"
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Search className="h-3.5 w-3.5" />
          }
        </Button>
      </div>

      {results.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-md border bg-popover divide-y">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-center gap-2 p-2 text-left hover:bg-muted/50 transition-colors"
              onClick={() => { onSelect(r); setResults([]); setQuery(""); setSearched(false); }}
            >
              {r.coverUrl ? (
                <img src={r.coverUrl} alt="" className="w-8 h-12 object-cover rounded-sm shrink-0" />
              ) : (
                <div className="w-8 h-12 bg-muted rounded-sm shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{r.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{r.author}</p>
                {r.totalPages > 0 && (
                  <p className="text-[10px] text-muted-foreground">{r.totalPages} pág.</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground text-center py-2">No se encontraron resultados</p>
      )}
    </div>
  );
}
