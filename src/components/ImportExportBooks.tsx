import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/hooks/useBooks";

interface ImportExportBooksProps {
  onImport: (books: Omit<Book, "id" | "addedAt">[]) => Promise<void>;
}

function parseGoodreadsCSV(text: string): Omit<Book, "id" | "addedAt">[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const titleIdx = header.findIndex(h => h === "title");
  const authorIdx = header.findIndex(h => h.includes("author"));
  const pagesIdx = header.findIndex(h => h.includes("number of pages") || h === "num pages");
  const ratingIdx = header.findIndex(h => h === "my rating");
  const shelfIdx = header.findIndex(h => h.includes("exclusive shelf") || h === "bookshelves");
  const dateReadIdx = header.findIndex(h => h === "date read");
  const dateAddedIdx = header.findIndex(h => h === "date added");

  const results: Omit<Book, "id" | "addedAt">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse (handle quoted fields)
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
      current += char;
    }
    cols.push(current.trim());

    const title = titleIdx >= 0 ? cols[titleIdx] : "";
    const author = authorIdx >= 0 ? cols[authorIdx] : "";
    if (!title || !author) continue;

    const shelf = shelfIdx >= 0 ? cols[shelfIdx]?.toLowerCase() : "";
    const status = shelf === "currently-reading" ? "reading" as const : "finished" as const;
    const rating = ratingIdx >= 0 ? Math.min(5, Math.max(0, parseInt(cols[ratingIdx]) || 0)) : 0;
    const totalPages = pagesIdx >= 0 ? parseInt(cols[pagesIdx]) || 0 : 0;
    const dateRead = dateReadIdx >= 0 ? cols[dateReadIdx] : "";
    const dateAdded = dateAddedIdx >= 0 ? cols[dateAddedIdx] : "";

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
      const text = reader.result as string;
      const books = parseGoodreadsCSV(text);
      setPreview(books);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      await onImport(preview);
      toast({ title: "✅ Importación completada", description: `${preview.length} libros importados` });
      setOpen(false);
      setPreview([]);
    } catch {
      toast({ title: "Error", description: "Error al importar", variant: "destructive" });
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
          <DialogDescription>Importa tu biblioteca desde un CSV de Goodreads u otro formato compatible</DialogDescription>
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
