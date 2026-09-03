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
 * En móvil (sobre todo iOS Safari) el atributo `download` de un <a> no
 * siempre descarga el archivo: el navegador simplemente abre la imagen en
 * una pestaña. Usamos el Web Share API cuando está disponible — además de
 * guardar la imagen, permite compartirla directamente a Instagram/TikTok,
 * que es justo para lo que se genera esta tarjeta. En escritorio (u otros
 * navegadores sin soporte) recurrimos a la descarga clásica.
 */
async function shareOrDownloadImage(node: HTMLElement, filename: string, title: string) {
  const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, skipFonts: true });

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.canShare) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title });
        return;
      }
    } catch (err) {
      // El usuario cerró el panel de compartir: no es un error real.
      if (err instanceof Error && err.name === "AbortError") return;
      throw err;
    }
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
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
  const genreRanking = Object.entries(
    books.reduce<Record<string, number>>((genres, book) => {
      const genre = book.genre || "Sin género";
      genres[genre] = (genres[genre] || 0) + 1;
      return genres;
    }, {})
  ).sort(([, a], [, b]) => b - a).slice(0, 3);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await shareOrDownloadImage(cardRef.current, `mi-año-lector-${year}.png`, `Mi Año Lector ${year}`);
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

        {/* Tarjeta 9:16 para historias: todo es HTML/CSS para que la descarga sea fiable. */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden relative mx-auto"
          style={{
            aspectRatio: "9 / 16",
            width: "100%",
            maxWidth: "420px",
            background: [
              "radial-gradient(ellipse 70% 42% at 0% 0%, rgba(220,83,130,0.42) 0%, rgba(220,83,130,0) 68%)",
              "radial-gradient(ellipse 75% 48% at 100% 18%, rgba(230,173,91,0.24) 0%, rgba(230,173,91,0) 70%)",
              "radial-gradient(ellipse 62% 48% at 30% 88%, rgba(43,185,163,0.34) 0%, rgba(43,185,163,0) 70%)",
              "linear-gradient(155deg, #110d19 0%, #090b15 52%, #100d1b 100%)",
            ].join(", "),
            border: "1px solid rgba(212,175,131,0.18)",
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

          <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", padding: "36px 25px 27px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen style={{ width: "15px", height: "15px", color: "#f5d7a1" }} />
                <span style={{ fontSize: "10px", letterSpacing: "2.7px", textTransform: "uppercase", color: "rgba(243,237,227,0.8)", fontFamily: "system-ui, sans-serif" }}>Mi rincón lector</span>
              </div>
              <span style={{ border: "1px solid rgba(245,215,161,0.45)", borderRadius: "999px", padding: "5px 9px", fontSize: "9px", letterSpacing: "1px", fontFamily: "system-ui, sans-serif", color: "#f5d7a1" }}>RECAP</span>
            </div>

            <div style={{ marginTop: "45px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", color: "rgba(243,237,227,0.6)", fontFamily: "system-ui, sans-serif", margin: 0 }}>Mi año entre páginas</p>
              <p style={{ fontSize: "82px", fontWeight: 400, lineHeight: 0.95, letterSpacing: "-3px", margin: "14px 0 0", color: "#fff8ee" }}>{year}</p>
              <div style={{ width: "44px", height: "2px", background: "#f5d7a1", margin: "22px auto 0" }} />
            </div>

            <div style={{ marginTop: "38px", padding: "22px 14px", border: "1px solid rgba(243,237,227,0.16)", borderRadius: "18px", background: "rgba(9,8,16,0.38)" }}>
              <p style={{ textAlign: "center", fontSize: "46px", fontWeight: 400, lineHeight: 0.9, margin: 0, color: "#ffffff" }}>{totalBooks}</p>
              <p style={{ textAlign: "center", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "#f5d7a1", fontFamily: "system-ui, sans-serif", margin: "9px 0 0" }}>Historias terminadas</p>
              <div style={{ height: "1px", background: "rgba(243,237,227,0.14)", margin: "19px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                {[{ value: totalPages.toLocaleString(), label: "Páginas" }, { value: uniqueAuthors, label: "Autores" }, { value: `${physicalCount}/${digitalCount}`, label: "Físico / digital" }].map((stat) => (
                  <div key={stat.label} style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "0 3px" }}>
                    <p style={{ fontSize: "21px", fontWeight: 400, lineHeight: 1, margin: 0 }}>{stat.value}</p>
                    <p style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.7px", color: "rgba(243,237,227,0.6)", margin: "6px 0 0", fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#f5d7a1", fontFamily: "system-ui, sans-serif", margin: 0 }}>Tu mapa de géneros</p>
                <span style={{ fontSize: "8px", letterSpacing: "1px", color: "rgba(243,237,227,0.52)", fontFamily: "system-ui, sans-serif" }}>TOP 3</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {genreRanking.length > 0 ? genreRanking.map(([genre, count], index) => {
                  const colours = ["#e75086", "#8061df", "#e88946"];
                  const max = genreRanking[0][1];
                  return (
                    <div key={genre} style={{ display: "grid", gridTemplateColumns: "24px 1fr 24px", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", color: "#f5d7a1" }}>0{index + 1}</span>
                      <div style={{ position: "relative", overflow: "hidden", background: "rgba(243,237,227,0.12)", padding: "7px 9px" }}>
                        <div style={{ position: "absolute", inset: 0, width: `${Math.round((count / max) * 100)}%`, background: colours[index], opacity: 0.55 }} />
                        <span style={{ position: "relative", zIndex: 1, fontSize: "11px", fontFamily: "system-ui, sans-serif" }}>{genre}</span>
                      </div>
                      <span style={{ textAlign: "right", fontSize: "16px" }}>{count}</span>
                    </div>
                  );
                }) : <p style={{ margin: 0, fontSize: "12px", color: "rgba(243,237,227,0.65)" }}>Tu ranking aparecerá con tus próximas lecturas.</p>}
              </div>
            </div>

            <div style={{ marginTop: "auto", paddingTop: "24px" }}>
              <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(243,237,227,0.62)", fontStyle: "italic", margin: "0 0 7px" }}>Cada libro deja una luz encendida.</p>
              <p style={{ textAlign: "center", fontSize: "9px", opacity: 0.48, letterSpacing: "1.8px", fontFamily: "system-ui, sans-serif", margin: 0 }}>BOOK TRACKER</p>
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
      await shareOrDownloadImage(cardRef.current, `mejores-libros-${year}.png`, `Mejores Libros de ${year}`);
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
