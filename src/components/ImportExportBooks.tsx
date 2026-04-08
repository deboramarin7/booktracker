import { useRef, useState } from "react";
import { Upload, Loader as Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface WishlistImportItem {
  title: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
}

interface ImportExportBooksProps {
  onImport: (books: Omit<Book, "id" | "addedAt">[]) => Promise<Book[] | void>;
  onImportWishlist?: (items: WishlistImportItem[]) => Promise<void>;
}

interface ParsedBook extends Omit<Book, "id" | "addedAt"> {
  _isbn?: string;
  _isWishlist?: boolean;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current); current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function fixEncoding(str: string): string {
  try { return decodeURIComponent(escape(str)); } catch { return str; }
}

function cleanIsbn(raw: string): string {
  return raw.replace(/[^0-9X]/gi, "").trim();
}

function findIdx(header: string[], ...matches: string[]): number {
  return header.findIndex(h => matches.some(m => h === m || h.includes(m)));
}

function normalizeRows(rows: string[][]): ParsedBook[] {
  if (rows.length < 2) return [];

  const header = rows[0].map(h => String(h ?? "").trim().toLowerCase());

  const idx = {
    title:     findIdx(header, "title", "título", "titulo", "libro", "book"),
    author:    findIdx(header, "author", "autor", "autora"),
    pages:     findIdx(header, "number of pages", "num pages", "páginas", "paginas", "pages"),
    rating:    findIdx(header, "my rating", "rating", "puntuación", "puntuacion", "valoración"),
    shelf:     findIdx(header, "exclusive shelf", "bookshelves", "shelf", "estado", "estante"),
    dateRead:  findIdx(header, "date read", "fecha de lectura", "fecha leído"),
    dateAdded: findIdx(header, "date added", "fecha añadido", "fecha agregado"),
    isbn13:    findIdx(header, "isbn13"),
    isbn:      findIdx(header, "isbn"),
    notes:     findIdx(header, "my review", "review", "notes", "notas", "reseña"),
    format:    findIdx(header, "binding", "format", "formato", "encuadernación"),
  };

  const results: ParsedBook[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.every(c => !c)) continue;

    try {
      const title  = idx.title  >= 0 ? fixEncoding(String(cols[idx.title]  ?? "").trim()) : "";
      const author = idx.author >= 0 ? fixEncoding(String(cols[idx.author] ?? "").trim()) : "";
      if (!title || !author) continue;

      const shelf      = idx.shelf >= 0 ? String(cols[idx.shelf] ?? "").trim().toLowerCase() : "";
      const isWishlist = ["to-read", "quiero-leer", "quiero leer", "want to read"].includes(shelf);
      const status     = shelf === "currently-reading" || shelf === "leyendo" ? "reading" as const : "finished" as const;
      const rating     = idx.rating >= 0 ? Math.min(5, Math.max(0, parseInt(String(cols[idx.rating] ?? "0")) || 0)) : 0;
      const totalPages = idx.pages >= 0 ? parseInt(String(cols[idx.pages] ?? "0").replace(/\D/g, "") || "0") || 0 : 0;
      const dateRead   = idx.dateRead  >= 0 ? String(cols[idx.dateRead]  ?? "").trim() : "";
      const dateAdded  = idx.dateAdded >= 0 ? String(cols[idx.dateAdded] ?? "").trim() : "";
      const notes      = idx.notes  >= 0 ? String(cols[idx.notes]  ?? "").replace(/<br\s*\/?>/gi, "\n").trim() : "";
      const format     = idx.format >= 0 ? String(cols[idx.format] ?? "").trim() : "";
      const isbn       = cleanIsbn(String(cols[idx.isbn13] ?? "")) || cleanIsbn(String(cols[idx.isbn] ?? ""));

      results.push({
        title, author, format, status, totalPages, rating, notes,
        hasSaga: false, genre: "", source: "", tags: [],
        pagesRead:  status === "finished" ? totalPages : 0,
        startDate:  dateAdded || undefined,
        endDate:    dateRead  || undefined,
        _isbn:      isbn      || undefined,
        _isWishlist: isWishlist,
      });
    } catch (err) {
      console.error(`Error parsing row ${i}:`, err);
    }
  }

  return results;
}

function parseCSV(text: string): ParsedBook[] {
  return normalizeRows(text.split(/\r?\n/).map(parseCSVLine));
}

function parseExcel(buffer: ArrayBuffer): ParsedBook[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  return normalizeRows(rows as string[][]);
}

async function fetchCover(book: ParsedBook): Promise<string | undefined> {
  try {
    const cleanTitle  = book.title.replace(/\s*\(.*?\)\s*/g, "").trim();
    const body: Record<string, string> = { title: cleanTitle, author: book.author };
    if (book._isbn) body.isbn = book._isbn;

    const { data, error } = await supabase.functions.invoke("search-books", { body });
    if (!error && data?.books?.length) return data.books[0]?.coverUrl ?? undefined;
  } catch { }
  return undefined;
}

async function enrichWithCovers(
  books: ParsedBook[],
  onProgress: (current: number, total: number) => void
): Promise<ParsedBook[]> {
  const CONCURRENCY = 5;
  const results: ParsedBook[] = new Array(books.length);
  let done = 0;

  for (let i = 0; i < books.length; i += CONCURRENCY) {
    const batch = books.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (book, j) => {
      const coverUrl = await fetchCover(book);
      results[i + j] = { ...book, coverUrl: coverUrl || undefined };
      onProgress(++done, books.length);
    }));
  }

  return results;
}

export function ImportBooksDialog({ onImport, onImportWishlist }: ImportExportBooksProps) {
  const [open, setOpen]               = useState(false);
  const [importing, setImporting]     = useState(false);
  const [fetchingCovers, setFetching] = useState(false);
  const [coverProgress, setProgress] = useState({ current: 0, total: 0 });
  const [preview, setPreview]         = useState<ParsedBook[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const books = isExcel
          ? parseExcel(reader.result as ArrayBuffer)
          : parseCSV(reader.result as string);

        if (!books.length) {
          toast({ title: "No se encontraron libros", description: "Verifica que el archivo tenga columnas: Título, Autor, Páginas...", variant: "destructive" });
        }
        setPreview(books);
      } catch (err) {
        toast({ title: "Error al leer el archivo", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
      }
    };

    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;

    setFetching(true);
    setProgress({ current: 0, total: preview.length });
    let enriched = preview;
    try {
      enriched = await enrichWithCovers(preview, (current, total) => setProgress({ current, total }));
    } catch {
    } finally {
      setFetching(false);
    }

    setImporting(true);
    try {
      const libraryBooks  = enriched.filter(b => !b._isWishlist);
      const wishlistBooks = enriched.filter(b => b._isWishlist);
      let libraryCount = 0;
      let wishlistCount = 0;

      if (libraryBooks.length > 0) {
        const toSave = libraryBooks.map(({ _isbn, _isWishlist, ...rest }) => rest);
        const result = await onImport(toSave);
        libraryCount = Array.isArray(result) ? result.length : toSave.length;
      }

      if (wishlistBooks.length > 0 && onImportWishlist) {
        const items = wishlistBooks.map(b => ({ title: b.title, author: b.author, coverUrl: b.coverUrl, totalPages: b.totalPages }));
        await onImportWishlist(items);
        wishlistCount = items.length;
      }

      const parts = [
        libraryCount  > 0 ? `${libraryCount} libro${libraryCount  !== 1 ? "s" : ""} a biblioteca` : "",
        wishlistCount > 0 ? `${wishlistCount} libro${wishlistCount !== 1 ? "s" : ""} a wishlist`   : "",
      ].filter(Boolean);

      toast({ title: "Importacion completada", description: parts.join(" · ") || "Sin cambios" });
      setOpen(false);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast({ title: "Error al importar", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const libCount  = preview.filter(b => !b._isWishlist).length;
  const wishCount = preview.filter(b => b._isWishlist).length;
  const isWorking = importing || fetchingCovers;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPreview([]); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Importar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Importar libros</DialogTitle>
          <DialogDescription>Importa desde Goodreads o cualquier CSV/Excel con columnas: Título, Autor, Páginas...</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
              Seleccionar archivo CSV o Excel
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">Formatos: .csv · .xlsx · .xls</p>
          </div>

          {preview.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {libCount > 0 && <span>{libCount} a biblioteca</span>}
                {libCount > 0 && wishCount > 0 && <span> · </span>}
                {wishCount > 0 && <span>{wishCount} a wishlist</span>}
              </p>
              <div className="max-h-48 overflow-y-auto rounded-md border divide-y text-sm">
                {preview.slice(0, 20).map((b, i) => (
                  <div key={i} className="p-2 flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{b.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.author}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {b._isWishlist ? "Wishlist" : b.status === "reading" ? "Leyendo" : "Terminado"}
                    </span>
                  </div>
                ))}
                {preview.length > 20 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">...y {preview.length - 20} más</p>
                )}
              </div>
              <Button onClick={handleImport} disabled={isWorking} className="w-full">
                {fetchingCovers ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Buscando portadas... {coverProgress.current}/{coverProgress.total}</>
                ) : importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</>
                ) : (
                  `Importar ${preview.length} libro${preview.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
