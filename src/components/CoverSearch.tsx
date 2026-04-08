import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, CircleCheck as CheckCircle2, BookOpen } from "lucide-react";

interface CoverSearchProps {
  title: string;
  author: string;
  currentCoverUrl: string;
  onCoverSelect: (url: string) => void;
}

interface CoverOption {
  url: string;
  source: string;
}

export function CoverSearch({ title, author, currentCoverUrl, onCoverSelect }: CoverSearchProps) {
  const [loading, setLoading] = useState(false);
  const [covers, setCovers] = useState<CoverOption[]>([]);
  const [searched, setSearched] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSearch = async () => {
    if (!title) return;
    setLoading(true);
    setSearched(true);
    setCovers([]);

    try {
      const { data, error } = await supabase.functions.invoke("search-books", {
        body: { title, author, coversOnly: true },
      });

      if (error || !data) {
        setCovers([]);
        return;
      }

      const found: CoverOption[] = [];
      const seen = new Set<string>();

      if (data.covers && Array.isArray(data.covers)) {
        for (const c of data.covers) {
          if (c.url && !seen.has(c.url)) {
            seen.add(c.url);
            found.push({ url: c.url, source: c.source || "Web" });
          }
        }
      } else if (data.books && Array.isArray(data.books)) {
        for (const b of data.books) {
          if (b.coverUrl && !seen.has(b.coverUrl)) {
            seen.add(b.coverUrl);
            found.push({ url: b.coverUrl, source: "Google Books" });
          }
        }
      }

      setCovers(found);
    } catch {
      setCovers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="font-body text-sm">Portada</Label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={currentCoverUrl}
            onChange={(e) => {
              onCoverSelect(e.target.value);
              setImgError(false);
            }}
            placeholder="https://..."
            className="pr-2 font-body text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={loading || !title}
          className="shrink-0 gap-1.5 font-body text-sm"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          {loading ? "Buscando..." : "Buscar portadas"}
        </Button>
      </div>

      {currentCoverUrl && (
        <div className="flex items-start gap-3">
          <div className="w-16 shrink-0">
            {!imgError ? (
              <img
                src={currentCoverUrl}
                alt="Portada actual"
                className="w-16 h-24 object-cover rounded shadow-sm border border-border"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-16 h-24 rounded border border-border bg-muted flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-1 font-body">Portada actual</p>
        </div>
      )}

      {searched && !loading && covers.length === 0 && (
        <p className="text-xs text-muted-foreground font-body">No se encontraron portadas alternativas.</p>
      )}

      {covers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-body">
            Selecciona una portada alternativa:
          </p>
          <div className="flex flex-wrap gap-2">
            {covers.map((cover, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onCoverSelect(cover.url);
                  setImgError(false);
                }}
                className={`relative group rounded overflow-hidden border-2 transition-all ${
                  currentCoverUrl === cover.url
                    ? "border-primary shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <CoverOptionImage url={cover.url} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-body">{cover.source}</span>
                </div>
                {currentCoverUrl === cover.url && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="w-4 h-4 text-primary fill-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoverOptionImage({ url }: { url: string }) {
  const [error, setError] = useState(false);
  return error ? (
    <div className="w-16 h-24 bg-muted flex items-center justify-center">
      <BookOpen className="w-4 h-4 text-muted-foreground" />
    </div>
  ) : (
    <img
      src={url}
      alt="Portada"
      className="w-16 h-24 object-cover"
      onError={() => setError(true)}
    />
  );
}
