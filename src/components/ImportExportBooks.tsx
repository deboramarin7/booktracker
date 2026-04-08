import { useRef, useState } from "react";
import { Upload, Loader as Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";
import * as XLSX from "xlsx";

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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

interface ParsedBookWithISBN extends Omit<Book, "id" | "addedAt"> {
  _isbn?: string;
  _searchQuery?: string;
  _isWishlist?: boolean;
}

function fixEncoding(str: string): string {
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
}

function cleanIsbn(raw: string): string {
  return raw.replace(/[^0-9X]/gi, "").trim();
}

function normalizeRows(rows: string[][]): ParsedBookWithISBN[] {
  if (rows.length < 2) return [];

  const headerCols = rows[0];
  const header = headerCols.map(h => String(h ?? "").trim().toLowerCase());

  const titleIdx = header.findIndex(h =>
    h === "title" || h === "título" || h === "titulo" || h === "libro" || h === "book"
  );
  const authorIdx = header.findIndex(h =>
    h === "author" || h === "autor" || h === "autora" || h.includes("author") || h.includes("autor")
  );
  const pagesIdx = header.findIndex(h =>
    h === "number of pages" || h === "num pages" || h === "páginas" || h === "paginas" ||
    h === "pages" || h.includes("pages") || h.includes("página")
  );
  const ratingIdx = header.findIndex(h =>
    h === "my rating" || h === "rating" || h === "puntuación" || h === "puntuacion" ||
    h === "valoración" || h === "valoracion" || h === "calificación" || h === "calificacion" ||
    h.includes("rating") || h.includes("puntuación")
  );
  const shelfIdx = header.findIndex(h =>
    h === "exclusive shelf" || h === "bookshelves" || h === "shelf" || h === "estado" ||
    h === "estante" || h.includes("shelf") || h.includes("estado")
  );
  const dateReadIdx = header.findIndex(h =>
    h === "date read" || h === "fecha de lectura" || h === "fecha leído" || h === "fecha leido" ||
    h.includes("date read") || (h.includes("fecha") && h.includes("lectura"))
  );
  const dateAddedIdx = header.findIndex(h =>
    h === "date added" || h === "fecha añadido" || h === "fecha agregado" || h === "fecha" ||
    h.includes("date added") || h.includes("añadido") || h.includes("agregado")
  );
  const isbnIdx = header.findIndex(h => h === "isbn" || h === "isbn13");
  const isbn13Idx = header.findIndex(h => h === "isbn13");
  const notesIdx = header.findIndex(h =>
    h === "my review" || h === "review" || h === "notes" || h === "notas" || h === "reseña"
  );
  const formatIdx = header.findIndex(h =>
    h === "binding" || h === "format" || h === "formato" || h === "encuadernación"
  );

  const results: ParsedBookWithISBN[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.every(c => !c)) continue;

    try {
      const title = titleIdx >= 0 ? fixEncoding(String(cols[titleIdx] ?? "").trim()) : "";
      const author = authorIdx >= 0 ? fixEncoding(String(cols[authorIdx] ?? "").trim()) : "";

      if (!title || !author) continue;

      const shelf = shelfIdx >= 0 ? String(cols[shelfIdx] ?? "").trim().toLowerCase() : "";
      const isWishlist = shelf === "to-read" || shelf === "quiero-leer" || shelf === "quiero leer" || shelf === "want to read";
      const status = shelf === "currently-reading" || shelf === "leyendo" ? "reading" as const : "finished" as const;
      const rating = ratingIdx >= 0 ? Math.min(5, Math.max(0, parseInt(String(cols[ratingIdx] ?? "0")) || 0)) : 0;
      const totalPages = pagesIdx >= 0 ? parseInt(String(cols[pagesIdx] ?? "0").replace(/\D/g, '') || "0") || 0 : 0;
      const dateRead = dateReadIdx >= 0 ? String(cols[dateReadIdx] ?? "").trim() : "";
      const dateAdded = dateAddedIdx >= 0 ? String(cols[dateAddedIdx] ?? "").trim() : "";
      const notes = notesIdx >= 0 ? String(cols[notesIdx] ?? "").replace(/<br\s*\/?>/gi, "\n").trim() : "";
      const format = formatIdx >= 0 ? String(cols[formatIdx] ?? "").trim() : "";

      const rawIsbn13 = isbn13Idx >= 0 ? cleanIsbn(String(cols[isbn13Idx] ?? "")) : "";
      const rawIsbn = isbnIdx >= 0 ? cleanIsbn(String(cols[isbnIdx] ?? "")) : "";
      const isbn = rawIsbn13 || rawIsbn;

      results.push({
        title,
        author,
        hasSaga: false,
        genre: "",
        format,
        source: "",
        status,
        totalPages,
        pagesRead: status === "finished" ? totalPages : 0,
        rating,
        notes,
        tags: [],
        startDate: dateAdded || undefined,
        endDate: dateRead || undefined,
        _isbn: isbn || undefined,
        _searchQuery: isbn ? `isbn:${isbn}` : `intitle:${title} inauthor:${author}`,
        _isWishlist: isWishlist,
      });
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error);
      continue;
    }
  }

  return results;
}

const GOOGLE_BOOKS_API_KEY = "AIzaSyDgSYwnvsjk4IRKo6HSD8Xcza57V0XdQbk";

async function fetchCoverUrl(book: ParsedBookWithISBN): Promise<string | undefined> {
  try {
    const query = book._isbn
      ? `isbn:${book._isbn}`
      : `intitle:${book.title.replace(/\s*\(.*?\)\s*/g, "").trim()} inauthor:${book.author}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&printType=books&key=${GOOGLE_BOOKS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return undefined;
    const links = item.volumeInfo?.imageLinks || {};
    const raw = links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail;
    if (!raw) return undefined;
    return raw.replace("http://", "https://").replace("&edge=curl", "").replace("zoom=1", "zoom=2");
  } catch {
    return undefined;
  }
}

async function enrichBooksWithCovers(
  books: ParsedBookWithISBN[],
  onProgress: (current: number, total: number) => void
): Promise<ParsedBookWithISBN[]> {
  const CONCURRENCY = 5;
  const results: ParsedBookWithISBN[] = new Array(books.length);
  let completed = 0;

  for (let i = 0; i < books.length; i += CONCURRENCY) {
    const batch = books.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (book, batchIdx) => {
        const idx = i + batchIdx;
        const coverUrl = await fetchCoverUrl(book);
        results[idx] = { ...book, coverUrl: coverUrl || undefined };
        completed++;
        onProgress(completed, books.length);
      })
    );
  }

  return results;
}

function parseCSV(text: string): ParsedBookWithISBN[] {
  const lines = text.split(/\r?\n/);
  const rows = lines.map(line => parseCSVLine(line));
  return normalizeRows(rows);
}

function parseExcel(buffer: ArrayBuffer): ParsedBookWithISBN[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  return normalizeRows(rows as string[][]);
}

export function ImportBooksDialog({ onImport, onImportWishlist }: ImportExportBooksProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fetchingCovers, setFetchingCovers] = useState(false);
  const [coverProgress, setCoverProgress] = useState({ current: 0, total: 0 });
  const [preview, setPreview] = useState<ParsedBookWithISBN[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const books = parseExcel(reader.result as ArrayBuffer);
          if (books.length === 0) {
            toast({
              title: "No se encontraron libros",
              description: "Verifica que el Excel tenga columnas como: Título, Autor, Páginas, etc.",
              variant: "destructive"
            });
          }
          setPreview(books);
        } catch (error) {
          toast({
            title: "Error al leer el archivo",
            description: error instanceof Error ? error.message : "Error desconocido",
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const books = parseCSV(text);
          if (books.length === 0) {
            toast({
              title: "No se encontraron libros",
              description: "Verifica que el CSV tenga columnas como: Título, Autor, Páginas, etc.",
              variant: "destructive"
            });
          }
          setPreview(books);
        } catch (error) {
          toast({
            title: "Error al leer el archivo",
            description: error instanceof Error ? error.message : "Error desconocido",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setFetchingCovers(true);
    setCoverProgress({ current: 0, total: preview.length });
    let enriched: ParsedBookWithISBN[];
    try {
      enriched = await enrichBooksWithCovers(preview, (current, total) => {
        setCoverProgress({ current, total });
      });
    } catch {
      enriched = preview;
    } finally {
      setFetchingCovers(false);
    }

    const wishlistBooks = enriched.filter(b => b._isWishlist);
    const libraryBooks = enriched.filter(b => !b._isWishlist);

    setImporting(true);
    try {
      let libraryCount = 0;
      let wishlistCount = 0;

      if (libraryBooks.length > 0) {
        const toImport = libraryBooks.map(({ _isbn: _i, _searchQuery: _q, _isWishlist: _w, ...rest }) => rest);
        const result = await onImport(toImport);
        libraryCount = Array.isArray(result) ? result.length : toImport.length;
      }

      if (wishlistBooks.length > 0 && onImportWishlist) {
        const wishItems = wishlistBooks.map(b => ({
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
          totalPages: b.totalPages,
        }));
        await onImportWishlist(wishItems);
        wishlistCount = wishItems.length;
      }

      const parts: string[] = [];
      if (libraryCount > 0) parts.push(`${libraryCount} libro${libraryCount !== 1 ? 's' : ''} a biblioteca`);
      if (wishlistCount > 0) parts.push(`${wishlistCount} libro${wishlistCount !== 1 ? 's' : ''} a wishlist`);

      toast({
        title: "Importacion completada",
        description: parts.join(" y ") || "Sin cambios"
      });
      setOpen(false);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al importar los libros";
      toast({
        title: "Error al importar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

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
          <DialogDescription>Importa tu biblioteca desde un archivo CSV o Excel (.xlsx, .xls) con columnas: Título, Autor, Páginas, etc.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
              Seleccionar archivo CSV o Excel
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">Formatos admitidos: .csv, .xlsx, .xls</p>
          </div>

          {preview.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{preview.filter(b => !b._isWishlist).length} libros a biblioteca · {preview.filter(b => b._isWishlist).length} a wishlist</p>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border divide-y text-sm">
                {preview.slice(0, 20).map((b, i) => (
                  <div key={i} className="p-2 flex justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.author}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {b._isWishlist ? "Wishlist" : b.status === "reading" ? "Leyendo" : "Terminado"}
                    </span>
                  </div>
                ))}
                {preview.length > 20 && <div className="p-2 text-center text-xs text-muted-foreground">...y {preview.length - 20} más</div>}
              </div>
              <Button onClick={handleImport} disabled={importing || fetchingCovers} className="w-full">
                {fetchingCovers ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Buscando portadas... {coverProgress.current}/{coverProgress.total}</>
                ) : importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
                ) : (
                  `Importar ${preview.length} libros`
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
