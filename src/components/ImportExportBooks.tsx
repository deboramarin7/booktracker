import { useRef, useState } from "react";
import { Upload, Loader as Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

interface ImportExportBooksProps {
  onImport: (books: Omit<Book, "id" | "addedAt">[]) => Promise<Book[] | void>;
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

function parseGoodreadsCSV(text: string): Omit<Book, "id" | "addedAt">[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerCols = parseCSVLine(lines[0]);
  const header = headerCols.map(h => h.trim().toLowerCase());

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
    h.includes("date read") || h.includes("fecha") && h.includes("lectura")
  );
  const dateAddedIdx = header.findIndex(h =>
    h === "date added" || h === "fecha añadido" || h === "fecha agregado" || h === "fecha" ||
    h.includes("date added") || h.includes("añadido") || h.includes("agregado")
  );

  const results: Omit<Book, "id" | "addedAt">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const cols = parseCSVLine(line);

      const title = titleIdx >= 0 ? cols[titleIdx]?.trim() || "" : "";
      const author = authorIdx >= 0 ? cols[authorIdx]?.trim() || "" : "";

      if (!title || !author) continue;

      const shelf = shelfIdx >= 0 ? (cols[shelfIdx]?.trim() || "").toLowerCase() : "";
      const status = shelf === "currently-reading" ? "reading" as const : "finished" as const;
      const rating = ratingIdx >= 0 ? Math.min(5, Math.max(0, parseInt(cols[ratingIdx]) || 0)) : 0;
      const totalPages = pagesIdx >= 0 ? parseInt(cols[pagesIdx]?.replace(/\D/g, '') || "0") || 0 : 0;
      const dateRead = dateReadIdx >= 0 ? cols[dateReadIdx]?.trim() || "" : "";
      const dateAdded = dateAddedIdx >= 0 ? cols[dateAddedIdx]?.trim() || "" : "";

      results.push({
        title,
        author,
        hasSaga: false,
        genre: "",
        format: "",
        source: "",
        status,
        totalPages,
        pagesRead: status === "finished" ? totalPages : 0,
        rating,
        notes: "",
        tags: [],
        startDate: dateAdded || undefined,
        endDate: dateRead || undefined,
      });
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
      continue;
    }
  }

  return results;
}

export function ImportBooksDialog({ onImport }: ImportExportBooksProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Omit<Book, "id" | "addedAt">[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        console.log('CSV text loaded, length:', text.length);
        const books = parseGoodreadsCSV(text);
        console.log('Books parsed:', books.length);
        if (books.length === 0) {
          toast({
            title: "No se encontraron libros",
            description: "Verifica que el CSV tenga columnas como: Título, Autor, Páginas, etc.",
            variant: "destructive"
          });
        }
        setPreview(books);
      } catch (error) {
        console.error('Error loading CSV:', error);
        toast({
          title: "Error al leer el archivo",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive"
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error al leer el archivo",
        description: "No se pudo leer el archivo CSV",
        variant: "destructive"
      });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      console.log('Starting import of', preview.length, 'books');
      const result = await onImport(preview);
      console.log('Import result:', result);
      const importedCount = Array.isArray(result) ? result.length : preview.length;
      toast({
        title: "Importación completada",
        description: `${importedCount} libro${importedCount !== 1 ? 's' : ''} importado${importedCount !== 1 ? 's' : ''} correctamente`
      });
      setOpen(false);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      console.error('Import error:', error);
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
          <DialogDescription>Importa tu biblioteca desde cualquier CSV con columnas: Título, Autor, Páginas, etc.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
              Seleccionar archivo CSV
            </Button>
          </div>

          {preview.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">{preview.length} libros encontrados</p>
              <div className="max-h-48 overflow-y-auto rounded-md border divide-y text-sm">
                {preview.slice(0, 20).map((b, i) => (
                  <div key={i} className="p-2 flex justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.author}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {b.status === "finished" ? "✅" : "📖"}
                    </span>
                  </div>
                ))}
                {preview.length > 20 && <div className="p-2 text-center text-xs text-muted-foreground">...y {preview.length - 20} más</div>}
              </div>
              <Button onClick={handleImport} disabled={importing} className="w-full">
                {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</> : `Importar ${preview.length} libros`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
