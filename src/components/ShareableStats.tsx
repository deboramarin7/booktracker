import { useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Star, BookOpen } from "lucide-react";
import type { Book } from "@/hooks/useBooks";

interface ShareableStatsProps {
  year: number;
  books: Book[];
}

export function ShareableStats({ year, books }: ShareableStatsProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const totalBooks = books.length;
  const totalPages = books.reduce((s, b) => s + b.totalPages, 0);
  const avgRating = totalBooks > 0 ? (books.reduce((s, b) => s + b.rating, 0) / totalBooks).toFixed(1) : "0";
  const uniqueAuthors = new Set(books.map(b => b.author)).size;
  const uniqueGenres = new Set(books.filter(b => b.genre).map(b => b.genre)).size;
  const topGenre = (() => {
    const map: Record<string, number> = {};
    books.forEach(b => { map[b.genre] = (map[b.genre] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();
  const topAuthor = (() => {
    const map: Record<string, number> = {};
    books.forEach(b => { map[b.author] = (map[b.author] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();
  const bestBook = books.filter(b => b.rating > 0).sort((a, b) => b.rating - a.rating)[0];

  // Reading time stats
  const booksWithDates = books.filter(b => b.startDate && b.endDate);
  const avgDays = booksWithDates.length > 0
    ? (booksWithDates.reduce((s, b) => {
        const start = new Date(b.startDate!);
        const end = new Date(b.endDate!);
        return s + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0) / booksWithDates.length).toFixed(0)
    : null;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `mi-año-lector-${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
    }
  }, [year]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartir</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Tu Año Lector {year}</DialogTitle>
        </DialogHeader>

        {/* The shareable card */}
        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(270,50%,20%) 0%, hsl(340,60%,25%) 50%, hsl(30,70%,30%) 100%)",
            padding: "32px",
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <BookOpen style={{ width: "24px", height: "24px" }} />
              <span style={{ fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8 }}>Mi Año Lector</span>
            </div>
            <p style={{ fontSize: "48px", fontWeight: "800", lineHeight: 1 }}>{year}</p>
          </div>

          {/* Main stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "36px", fontWeight: "800" }}>{totalBooks}</p>
              <p style={{ fontSize: "11px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Libros</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "36px", fontWeight: "800" }}>{totalPages.toLocaleString()}</p>
              <p style={{ fontSize: "11px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Páginas</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "36px", fontWeight: "800" }}>{uniqueAuthors}</p>
              <p style={{ fontSize: "11px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>Autores</p>
            </div>
          </div>

          {/* Secondary stats */}
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "10px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Género favorito</p>
                <p style={{ fontSize: "16px", fontWeight: "700" }}>{topGenre}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Autor/a más leído/a</p>
                <p style={{ fontSize: "16px", fontWeight: "700" }}>{topAuthor}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Puntuación media</p>
                <p style={{ fontSize: "16px", fontWeight: "700" }}>{"★".repeat(Math.round(Number(avgRating)))} {avgRating}</p>
              </div>
              <div>
                <p style={{ fontSize: "10px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>{avgDays ? "Media días/libro" : "Géneros leídos"}</p>
                <p style={{ fontSize: "16px", fontWeight: "700" }}>{avgDays ? `${avgDays} días` : uniqueGenres}</p>
              </div>
            </div>
          </div>


          {/* Cover strip */}
          {books.filter(b => b.coverUrl).length > 0 && (
            <div style={{ display: "flex", gap: "4px", justifyContent: "center", overflow: "hidden", marginBottom: "16px" }}>
              {books.filter(b => b.coverUrl).slice(0, 8).map((b, i) => (
                <img
                  key={i}
                  src={b.coverUrl}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: "40px", height: "60px", objectFit: "cover", borderRadius: "4px", opacity: 0.9 }}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: "10px", opacity: 0.4, letterSpacing: "1px" }}>
            📚 Book Tracker
          </p>
        </div>

        <Button onClick={handleDownload} className="w-full gap-2 mt-2">
          <Download className="h-4 w-4" />
          Descargar imagen
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface BestOfYearProps {
  year: number;
  books: Book[];
}

export function BestOfYearExport({ year, books }: BestOfYearProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const topBooks = books
    .filter(b => b.rating > 0)
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
    .slice(0, 10);

  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `mejores-libros-${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
    }
  }, [year]);

  const handleDownloadCSV = useCallback(() => {
    const headers = ["Puesto", "Título", "Autor/a", "Puntuación", "Género", "Páginas"];
    const rows = topBooks.map((b, i) => [
      i + 1, b.title, b.author, b.rating, b.genre, b.totalPages,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mejores-libros-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [topBooks, year]);

  if (topBooks.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Mejores del año</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Mejores Libros de {year}</DialogTitle>
        </DialogHeader>

        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(220,40%,15%) 0%, hsl(250,35%,20%) 100%)",
            padding: "28px",
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.6 }}>⭐ Mis mejores libros</p>
            <p style={{ fontSize: "36px", fontWeight: "800", lineHeight: 1.2 }}>{year}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topBooks.map((book, i) => (
              <div
                key={book.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              >
                <span style={{
                  fontSize: i === 0 ? "20px" : "14px",
                  fontWeight: "800",
                  opacity: 0.5,
                  minWidth: "24px",
                }}>
                  {i === 0 ? "🏆" : `${i + 1}`}
                </span>
                {book.coverUrl && (
                  <img
                    src={book.coverUrl}
                    alt=""
                    crossOrigin="anonymous"
                    style={{ width: "28px", height: "42px", objectFit: "cover", borderRadius: "3px", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</p>
                  <p style={{ fontSize: "11px", opacity: 0.6 }}>{book.author}</p>
                </div>
                <span style={{ fontSize: "12px", color: "gold", flexShrink: 0 }}>
                  {"★".repeat(book.rating)}
                </span>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "10px", opacity: 0.3, marginTop: "16px", letterSpacing: "1px" }}>
            📚 Book Tracker
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          <Button onClick={handleDownloadImage} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Imagen
          </Button>
          <Button onClick={handleDownloadCSV} variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
