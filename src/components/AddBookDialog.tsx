import { useState } from "react";
import { TagInput } from "@/components/TagInput";
import { BookSearchGoogle } from "@/components/BookSearchGoogle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ReadingStatus, Book } from "@/hooks/useBooks";
import type { WishItem } from "@/hooks/useWishlist";
import { GENRES, FORMATS, SOURCES, STATUSES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface AddBookDialogProps {
  onAdd: (data: Omit<Book, "id" | "addedAt">) => void;
  onAddToWishlist?: (data: Omit<WishItem, "id">) => void;
}

export function AddBookDialog({ onAdd, onAddToWishlist }: AddBookDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [sagaName, setSagaName] = useState("");
  const [sagaOrder, setSagaOrder] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [source, setSource] = useState(SOURCES[0]);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<ReadingStatus>("reading");
  const [totalPages, setTotalPages] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [rating, setRating] = useState("0");
  const [tags, setTags] = useState<string[]>([]);

  const reset = () => {
    setTitle(""); setAuthor(""); setCoverUrl("");
    setSagaName(""); setSagaOrder(""); setGenre(GENRES[0]);
    setFormat(FORMATS[0]); setSource(SOURCES[0]); setPrice("");
    setStatus("reading"); setTotalPages(""); setPagesRead("");
    setStartDate(new Date().toISOString().slice(0, 10)); setEndDate(""); setRating("0"); setTags([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    if (status === "want-to-read" && onAddToWishlist) {
      onAddToWishlist({
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim() || undefined,
        hasSaga: !!sagaName.trim(),
        saga: sagaName.trim() || undefined,
        sagaOrder: sagaOrder.trim() || undefined,
        genre,
        priority: 3,
        status: "Buscar",
        totalPages: Number(totalPages) || 0,
      });
      toast({ title: "Añadido a Wish List", description: `"${title.trim()}" se ha añadido a tu lista de deseos` });
    } else {
      onAdd({
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim() || undefined,
        hasSaga: !!sagaName.trim(),
        saga: sagaName.trim() || undefined,
        sagaOrder: sagaOrder.trim() || undefined,
        genre,
        format,
        source,
        price: source === "Comprado" ? price.trim() || undefined : undefined,
        status,
        totalPages: Number(totalPages) || 0,
        pagesRead: status === "finished" ? (Number(totalPages) || 0) : (Number(pagesRead) || 0),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        rating: status === "finished" ? (Number(rating) || 0) : 0,
        notes: "",
        tags,
      });
    }
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 font-body">
          <Plus className="h-5 w-5" />
          Añadir libro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Nuevo libro</DialogTitle>
          <DialogDescription>Agrega un libro a tu colección</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Google Books search */}
          <div className="space-y-1.5">
            <Label className="font-body text-sm">🔍 Buscar libro</Label>
            <BookSearchGoogle onSelect={(r) => {
              setTitle(r.title);
              setAuthor(r.author);
              if (r.coverUrl) setCoverUrl(r.coverUrl);
              if (r.totalPages) setTotalPages(String(r.totalPages));
              if (r.sagaName) {
                setSagaName(r.sagaName);
                setSagaOrder(r.sagaOrder || "");
              }
            }} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del libro" required />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm">Autor/a *</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Nombre del autor/a" required />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm">URL de portada</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>

          {/* Saga */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="font-body text-sm">Nombre de saga</Label>
              <Input value={sagaName} onChange={(e) => setSagaName(e.target.value)} placeholder="Ej: Empíreo" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Orden en saga</Label>
              <Input value={sagaOrder} onChange={(e) => setSagaOrder(e.target.value)} placeholder="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Género</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {status !== "want-to-read" && (
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Procedencia + Precio - only if not want-to-read */}
          {status !== "want-to-read" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Procedencia</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {source === "Comprado" && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label className="font-body text-sm">Precio</Label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="22.90 €" />
                </div>
              )}
            </div>
          )}

          {/* Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ReadingStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Páginas totales</Label>
              <Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="350" min={0} />
            </div>
          </div>

          {/* Páginas leídas - only if reading */}
          {status === "reading" && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="font-body text-sm">Páginas leídas</Label>
              <Input type="number" value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} placeholder="0" min={0} />
            </div>
          )}

          {/* Dates */}
          {status !== "want-to-read" && (
            <div className="grid grid-cols-2 gap-3">
              {(status === "reading" || status === "finished") && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label className="font-body text-sm">Fecha inicio</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              )}
              {status === "finished" && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label className="font-body text-sm">Fecha fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Rating - only finished */}
          {status === "finished" && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="font-body text-sm">Puntuación (0-5)</Label>
              <Input type="number" value={rating} onChange={(e) => setRating(e.target.value)} min={0} max={5} className="w-24" />
            </div>
          )}

          {status !== "want-to-read" && (
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Etiquetas</Label>
              <TagInput tags={tags} onChange={setTags} placeholder="vacaciones, recomendado..." />
            </div>
          )}

          <Button type="submit" className="w-full font-body">Agregar libro</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
