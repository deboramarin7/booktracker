import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Star, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

/**
 * Las portadas vienen de dominios externos (Open Library, Amazon...) que no
 * siempre responden con cabeceras CORS y siguen dando problemas al exportar
 * la tarjeta como imagen, así que la tarjeta "Mi Año Lector" ya no las usa.
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
  const uniqueAuthors = new Set(books.map(b => b.author)).size;
  const physicalCount = books.filter(b => b.format === "Físico").length;
  const digitalCount = books.filter(b => b.format === "Digital").length;

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

        {/* The shareable card — diseño editorial oscuro con fondo de galaxia/nebulosa */}
        <div
          ref={cardRef}
          className="rounded-xl overflow-hidden relative"
          style={{
            background: [
              "radial-gradient(ellipse 55% 40% at 15% 12%, rgba(255,80,140,0.45) 0%, rgba(255,80,140,0) 60%)",
              "radial-gradient(ellipse 60% 45% at 45% 30%, rgba(70,220,180,0.35) 0%, rgba(70,220,180,0) 60%)",
              "radial-gradient(ellipse 50% 35% at 78% 18%, rgba(255,170,90,0.25) 0%, rgba(255,170,90,0) 55%)",
              "radial-gradient(ellipse 55% 45% at 12% 80%, rgba(50,200,170,0.32) 0%, rgba(50,200,170,0) 55%)",
              "radial-gradient(ellipse 45% 35% at 85% 85%, rgba(150,80,220,0.22) 0%, rgba(150,80,220,0) 55%)",
              "linear-gradient(160deg, #050508 0%, #0a0712 50%, #060a0c 100%)",
            ].join(", "),
            border: "1px solid rgba(212,175,131,0.18)",
            padding: "36px 32px",
            color: "#f3ede3",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {/* Estrellas — patrón SVG tileado, 100% CSS/SVG, sin imágenes externas */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='12' cy='18' r='1' opacity='0.9'/%3E%3Ccircle cx='40' cy='55' r='0.6' opacity='0.5'/%3E%3Ccircle cx='75' cy='12' r='0.8' opacity='0.7'/%3E%3Ccircle cx='100' cy='40' r='1.2' opacity='0.9'/%3E%3Ccircle cx='130' cy='20' r='0.6' opacity='0.4'/%3E%3Ccircle cx='160' cy='60' r='1' opacity='0.8'/%3E%3Ccircle cx='195' cy='30' r='0.7' opacity='0.6'/%3E%3Ccircle cx='20' cy='90' r='0.9' opacity='0.7'/%3E%3Ccircle cx='55' cy='110' r='0.6' opacity='0.5'/%3E%3Ccircle cx='85' cy='85' r='1.3' opacity='0.9'/%3E%3Ccircle cx='115' cy='105' r='0.6' opacity='0.4'/%3E%3Ccircle cx='145' cy='95' r='1' opacity='0.8'/%3E%3Ccircle cx='180' cy='115' r='0.7' opacity='0.6'/%3E%3Ccircle cx='210' cy='85' r='0.9' opacity='0.7'/%3E%3Ccircle cx='10' cy='150' r='0.7' opacity='0.6'/%3E%3Ccircle cx='45' cy='170' r='1.1' opacity='0.9'/%3E%3Ccircle cx='70' cy='145' r='0.6' opacity='0.4'/%3E%3Ccircle cx='100' cy='185' r='0.9' opacity='0.7'/%3E%3Ccircle cx='135' cy='160' r='0.6' opacity='0.5'/%3E%3Ccircle cx='165' cy='190' r='1.2' opacity='0.9'/%3E%3Ccircle cx='200' cy='150' r='0.7' opacity='0.6'/%3E%3Ccircle cx='25' cy='210' r='0.6' opacity='0.5'/%3E%3Ccircle cx='60' cy='200' r='0.8' opacity='0.6'/%3E%3Ccircle cx='95' cy='215' r='0.6' opacity='0.4'/%3E%3Ccircle cx='125' cy='205' r='1' opacity='0.8'/%3E%3Ccircle cx='155' cy='215' r='0.6' opacity='0.5'/%3E%3Ccircle cx='190' cy='205' r='0.9' opacity='0.7'/%3E%3C/g%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
              pointerEvents: "none",
            }}
          />

          {/* Contenido — por encima de la nebulosa y las estrellas */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
                <BookOpen style={{ width: "16px", height: "16px", opacity: 0.7 }} />
                <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", opacity: 0.7, fontFamily: "system-ui, sans-serif" }}>
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
                    borderLeft: i > 0 ? "1px solid rgba(243,237,227,0.2)" : "none",
                  }}
                >
                  <p style={{ fontSize: "34px", fontWeight: 400, lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: "10px", opacity: 0.65, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "6px", fontFamily: "system-ui, sans-serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Físico vs Digital — mismo estilo editorial que la fila principal */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
              {[
                { value: physicalCount, label: "Físicos" },
                { value: digitalCount, label: "Digitales" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    textAlign: "center",
                    padding: "0 24px",
                    borderLeft: i > 0 ? "1px solid rgba(243,237,227,0.2)" : "none",
                  }}
                >
                  <p style={{ fontSize: "28px", fontWeight: 400, lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: "10px", opacity: 0.65, textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "6px", fontFamily: "system-ui, sans-serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p style={{ textAlign: "center", fontSize: "11px", opacity: 0.5, fontStyle: "italic", marginBottom: "4px" }}>
              Una lectura, una historia.
            </p>
            <p style={{ textAlign: "center", fontSize: "10px", opacity: 0.4, letterSpacing: "1px", fontFamily: "system-ui, sans-serif" }}>
              📚 Book Tracker
            </p>
          </div>
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
