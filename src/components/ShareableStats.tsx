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

/**
 * Se descarga siempre de forma directa. Esto evita que el botón "Descargar"
 * abra solamente la hoja de compartir en algunos móviles y parezca que no ha
 * hecho nada. En iPhone Safari puede abrir la imagen en otra pestaña: desde
 * ahí se guarda con una pulsación mantenida sobre la tarjeta.
 */
async function shareOrDownloadImage(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, skipFonts: true });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
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

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await shareOrDownloadImage(cardRef.current, `mi-año-lector-${year}.png`);
    } catch (err) {
      console.error("Error generating image", err);
      toast({
        title: "No se pudo generar la imagen",
        description: "Inténtalo de nuevo en unos segundos.",
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

        {/* Tarjeta 9:16 para historias. Sin portadas externas: exporta bien en móvil y escritorio. */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden relative mx-auto"
          style={{
            aspectRatio: "9 / 16",
            width: "100%",
            maxWidth: "420px",
            backgroundImage: "linear-gradient(180deg, rgba(5, 9, 16, 0.2) 0%, rgba(5, 9, 16, 0.58) 100%), url('/nebulosa.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fffdf8",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {/* Textura suave, generada en CSS: no depende de imágenes ni de fuentes externas. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(3, 7, 14, 0.04) 20%, rgba(3, 7, 14, 0.32) 100%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", padding: "36px 28px 30px" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <BookOpen style={{ width: "16px", height: "16px" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2.4px", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>Book Tracker</span>
            </div>

            <div style={{ marginTop: "105px", textAlign: "center" }}>
              <p style={{ fontSize: "18px", margin: 0, letterSpacing: "0.5px" }}>{year}</p>
              <p style={{ fontSize: "47px", fontWeight: 400, lineHeight: 0.98, letterSpacing: "-1.8px", margin: "13px 0 0" }}>Mi año<br />en libros</p>
              <div style={{ width: "42px", height: "2px", background: "#74eee0", margin: "22px auto 0" }} />
            </div>

            <div style={{ marginTop: "74px", display: "grid", gridTemplateColumns: "1fr 1px 1fr", alignItems: "center", gap: "13px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "44px", lineHeight: 0.95, margin: 0, letterSpacing: "-1.6px" }}>{totalPages.toLocaleString("es-ES")}</p>
                <p style={{ fontSize: "16px", margin: "10px 0 0" }}>páginas leídas</p>
              </div>
              <div style={{ width: "1px", height: "72px", background: "rgba(255, 255, 255, 0.44)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "44px", lineHeight: 0.95, margin: 0, letterSpacing: "-1.6px" }}>{totalBooks}</p>
                <p style={{ fontSize: "16px", margin: "10px 0 0" }}>libros leídos</p>
              </div>
            </div>

            <div style={{ marginTop: "auto", textAlign: "center" }}>
              <p style={{ fontSize: "14px", margin: 0, fontStyle: "italic" }}>Un año de historias para recordar.</p>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.68, margin: "13px 0 0" }}>Tu rincón lector</p>
            </div>
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
      await shareOrDownloadImage(cardRef.current, `mejores-libros-${year}.png`);
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
