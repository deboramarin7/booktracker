import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
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

export function BookSearchGoogle({ onSelect }: BookSearchGoogleProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-books", {
        body: { query: query.trim() },
      });

      if (error) {
        console.error("Search error:", error);
        setResults([]);
        return;
      }

      const items: BookSearchResult[] = (data?.books || []).map((b: any) => ({
        title: b.title || "",
        author: b.author || "",
        coverUrl: b.coverUrl || undefined,
        totalPages: b.totalPages || 0,
        genre: b.genre || undefined,
      }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, autor o ISBN..."
          className="text-sm h-8"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
        />
        <Button type="button" size="sm" variant="outline" onClick={search} disabled={loading} className="h-8 px-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-popover divide-y">
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
                {r.totalPages > 0 && <p className="text-[10px] text-muted-foreground">{r.totalPages} pág.</p>}
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
