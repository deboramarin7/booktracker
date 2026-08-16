import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Star, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseFlexibleDate } from "@/lib/dateUtils";
import type { Book } from "@/hooks/useBooks";

/**
 * Las portadas vienen de dominios externos (Open Library, Amazon...) que no
 * siempre responden con cabeceras CORS. Al mezclarlas directamente en un
 * <img> "contaminan" el <canvas> que genera html-to-image y la descarga
 * falla en silencio. Las servimos a través de un proxy de imágenes que sí
 * añade cabeceras CORS (images.weserv.nl) para poder exportarlas siempre.
 */
function proxiedCoverUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const bare = url.replace(/^https?:\/\//, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&output=jpg`;
}

interface ShareableStatsProps {
  year: number;
  books: Book[];
}

export function ShareableStats({ year, books }: ShareableStatsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Reading time stats — usamos el parser flexible para no confundir DD/MM/AAAA con MM/DD/AAAA
  const booksWithDates = books.filter(b => b.startDate && b.endDate);
  const avgDays = booksWithDates.length > 0
    ? (booksWithDates.reduce((s, b) => {
        const start = parseFlexibleDate(b.startDate) ?? new Date(b.startDate!);
        const end = parseFlexibleDate(b.endDate) ?? new Date(b.endDate!);
        return s + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0) / booksWithDates.length).toFixed(0)
    : null;

  const coverBooks = books.filter(b => b.coverUrl).slice(0, 10);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `mi-año-lector-${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
      toast({
        title: "No se pudo generar la imagen",
        description: "Puede que alguna portada haya bloqueado la descarga. Inténtalo de nuevo en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [year, toast]);

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

        {/* The shareable card — diseño editorial oscuro */}
        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden relative"
          style={{
            background: "linear-gradient(160deg, #0b0a09 0%, #17130f 55%, #201810 100%)",
            border: "1px solid rgba(212,175,131,0.18)",
            padding: "36px 32px",
            color: "#f3ede3",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
              <BookOpen style={{ width: "16px", height: "16px", opacity: 0.55 }} />
              <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", opacity: 0.55, fontFamily: "system-ui, sans-serif" }}>
                Mi Año Lector
              </span>
            </div>
            <p style={{ fontSize: "56px", fontWeight: 300, lineHeight: 1, letterSpacing: "1px" }}>{year}</p>
            <div style={{ width: "56px", height: "1px", background: "rgba(212,175,131,0.6)", margin: "16px auto 0" }} />
          </div>

          {/* Main stats — sin cajas, estilo editorial con separadores finos */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "26px" }}>
            {[
              { value: totalBooks, label: "Libros" },
              { value: totalPages.toLocaleString(), label: "Páginas" },
              { value: uniqueAuthors, label: "Autores" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  textAlign: "center",
                  padding: "0 24px",
                  borderLeft: i > 0 ? "1px solid rgba(243,237,227,0.15)" : "none",
                }}
              >
                <p style={{ fontSize: "34px", fontWeight: 400, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: "10px", opacity: 0.55, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "6px", fontFamily: "system-ui, sans-serif" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Secondary stats — lista editorial con reglas finas */}
          <div style={{ marginBottom: "26px" }}>
            {[
              { label: "Género favorito", value: topGenre },
              { label: "Autor/a más leído/a", value: topAuthor },
              { label: "Puntuación media", value: `${"★".repeat(Math.round(Number(avgRating)))} ${avgRating}` },
              { label: avgDays ? "Media días por libro" : "Géneros distintos leídos", value: avgDays ? `${avgDays} días` : String(uniqueGenres) },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "10px 2px",
                  borderTop: "1px solid rgba(243,237,227,0.12)",
                  borderBottom: i === arr.length - 1 ? "1px solid rgba(243,237,227,0.12)" : "none",
                }}
              >
                <span style={{ fontSize: "11px", opacity: 0.55, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "system-ui, sans-serif" }}>
                  {row.label}
                </span>
                <span style={{ fontSize: "15px", fontWeight: 600, textAlign: "right", marginLeft: "12px" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Cover collage — apiladas con ligera rotación, estilo editorial */}
          {coverBooks.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", padding: "8px 0" }}>
              {coverBooks.map((b, i) => (
                <img
                  key={i}
                  src={proxiedCoverUrl(b.coverUrl)}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    width: "48px",
                    height: "72px",
                    objectFit: "cover",
                    borderRadius: "3px",
                    marginLeft: i === 0 ? 0 : "-14px",
                    transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (3 + (i % 3))}deg)`,
                    border: "2px solid #17130f",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: "11px", opacity: 0.4, fontStyle: "italic", marginBottom: "4px" }}>
            Una lectura, una historia.
          </p>
          <p style={{ textAlign: "center", fontSize: "10px", opacity: 0.35, letterSpacing: "1px", fontFamily: "system-ui, sans-serif" }}>
            📚 Book Tracker
          </p>
        </div>

        <Button onClick={handleDownload} disabled={isGenerating} className="w-full gap-2 mt-2">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isGenerating ? "Generando imagen..." : "Descargar imagen"}
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
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const topBooks = books
    .filter(b => b.rating > 0)
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
    .slice(0, 10);

  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `mejores-libros-${year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
      toast({
        title: "No se pudo generar la imagen",
        description: "Puede que alguna portada haya bloqueado la descarga. Inténtalo de nuevo en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [year, toast]);

  const handleDownloadCSV = useCallback(() => {
    const headers = ["Puesto", "Título", "Autor/a", "Puntuación", "Género", "Páginas"];
    const rows = topBooks.map((b, i) => [
      i + 1, b.title, b.author, b.rating, b.genre, b.totalPages,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
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
                    src={proxiedCoverUrl(book.coverUrl)}
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
          <Button onClick={handleDownloadImage} disabled={isGenerating} className="flex-1 gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
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
