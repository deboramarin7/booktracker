import { useState } from "react";
import { RichNotesEditor } from "@/components/RichNotesEditor";
import { TagInput } from "@/components/TagInput";
import { CoverSearch } from "@/components/CoverSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ReadingStatus, Book } from "@/hooks/useBooks";
import { GENRES, FORMATS, SOURCES, STATUSES } from "@/lib/constants";

interface EditBookDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void;
}

export function EditBookDialog({ book, open, onOpenChange, onSave }: EditBookDialogProps) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || "");
  const [hasSaga, setHasSaga] = useState(book.hasSaga);
  const [sagaName, setSagaName] = useState(book.saga || "");
  const [sagaOrder, setSagaOrder] = useState(book.sagaOrder || "");
  const [genre, setGenre] = useState(book.genre);
  const [format, setFormat] = useState(book.format);
  const [source, setSource] = useState(book.source || SOURCES[0]);
  const [price, setPrice] = useState(book.price || "");
  const [status, setStatus] = useState<ReadingStatus>(book.status);
  const [totalPages, setTotalPages] = useState(String(book.totalPages));
  const [pagesRead, setPagesRead] = useState(String(book.pagesRead));
  const [startDate, setStartDate] = useState(book.startDate || "");
  const [endDate, setEndDate] = useState(book.endDate || "");
  const [rating, setRating] = useState(String(book.rating));
  const [notes, setNotes] = useState(book.notes);
  const [tags, setTags] = useState<string[]>(book.tags || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(book.id, {
      title: title.trim(),
      author: author.trim(),
      coverUrl: coverUrl.trim() || undefined,
      hasSaga,
      saga: hasSaga ? sagaName.trim() || undefined : undefined,
      sagaOrder: hasSaga ? sagaOrder.trim() || undefined : undefined,
      genre,
      format,
      source,
      price: source === "Comprado" ? price.trim() || undefined : undefined,
      status,
      totalPages: Number(totalPages) || 0,
      pagesRead: status === "finished" ? (Number(totalPages) || 0) : Math.min(Number(pagesRead) || 0, Number(totalPages) || 0),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      rating: status === "finished" ? Math.min(5, Math.max(0, Number(rating) || 0)) : 0,
      notes,
      tags,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Editar libro</DialogTitle>
          <DialogDescription>Modifica los datos del libro</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="font-body text-sm">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body text-sm">Autor/a</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} required />
          </div>

          <CoverSearch
            title={title}
            author={author}
            currentCoverUrl={coverUrl}
            onCoverSelect={setCoverUrl}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-body text-sm">¿Pertenece a una saga?</Label>
              <Switch checked={hasSaga} onCheckedChange={setHasSaga} />
            </div>
            {hasSaga && (
              <div className="grid grid-cols-3 gap-3 animate-fade-in">
                <div className="col-span-2 space-y-1.5">
                  <Label className="font-body text-xs text-muted-foreground">Nombre de la saga</Label>
                  <Input value={sagaName} onChange={(e) => setSagaName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs text-muted-foreground">Orden</Label>
                  <Input value={sagaOrder} onChange={(e) => setSagaOrder(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Género</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

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
              <Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} min={0} />
            </div>
          </div>

          {status === "reading" && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="font-body text-sm">Páginas leídas</Label>
              <Input type="number" value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} min={0} />
            </div>
          )}

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

          {status === "finished" && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="font-body text-sm">Puntuación (0-5)</Label>
              <Input type="number" value={rating} onChange={(e) => setRating(e.target.value)} min={0} max={5} className="w-24" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Notas / Reseña</Label>
            <RichNotesEditor
              value={notes}
              onChange={setNotes}
              maxLength={2000}
              placeholder="Escribe tu reseña... (soporta **negrita**, _cursiva_, - listas)"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-body text-sm">Etiquetas</Label>
            <TagInput tags={tags} onChange={setTags} placeholder="vacaciones, recomendado..." />
          </div>

          <Button type="submit" className="w-full font-body">Guardar cambios</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
