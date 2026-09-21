import { useEffect, useState } from "react";
import { Check, RotateCcw, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookCoverImage } from "@/components/BookCoverImage";
import type { Book } from "@/hooks/useBooks";

interface RereadBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { bookId: string; finishedAt: string; pagesRead: number; rating: number; notes: string }) => Promise<boolean>;
}

export function RereadBookDialog({ book, open, onOpenChange, onSave }: RereadBookDialogProps) {
  const [finishedAt, setFinishedAt] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && book) {
      setFinishedAt(new Date().toISOString().slice(0, 10));
      setRating(book.rating || 0);
      setNotes("");
    }
  }, [open, book]);

  if (!book) return null;

  const save = async () => {
    setSaving(true);
    const saved = await onSave({
      bookId: book.id,
      finishedAt: finishedAt || new Date().toISOString().slice(0, 10),
      pagesRead: book.totalPages || book.pagesRead || 0,
      rating,
      notes: notes.trim(),
    });
    setSaving(false);
    if (saved) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"><RotateCcw className="h-3.5 w-3.5" /> Otra vuelta a la historia</p>
          <DialogTitle className="font-display text-2xl">Registrar relectura</DialogTitle>
          <DialogDescription>Sumará un libro y sus páginas a tu año, sin duplicar esta portada en tu biblioteca.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-2xl border border-border/40 bg-muted/[0.16] p-3">
          <BookCoverImage src={book.coverUrl} alt={book.title} title={book.title} className="h-20 w-14 shrink-0 rounded-lg object-cover shadow-md" fallbackClassName="h-20 w-14 shrink-0 rounded-lg" />
          <div className="min-w-0 self-center"><p className="font-display font-semibold leading-tight">{book.title}</p><p className="mt-1 text-sm text-muted-foreground">{book.author}</p><p className="mt-1 text-xs text-primary">{book.totalPages || book.pagesRead || 0} páginas volverán a contar</p></div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="reread-date">Fecha en la que la terminaste</label>
          <input id="reread-date" type="date" value={finishedAt} onChange={(event) => setFinishedAt(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">¿Cuánto te gustó esta vez?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} estrellas`} className="rounded-lg p-1 text-amber-400 transition-transform hover:scale-110"><Star className={`h-8 w-8 ${value <= rating ? "fill-current" : "text-muted-foreground/30"}`} /></button>)}
            <span className="ml-2 self-center text-sm text-muted-foreground">{rating ? `${rating}/5` : "Opcional"}</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="reread-review">Reseña de esta relectura <span className="font-normal text-muted-foreground">opcional</span></label>
          <textarea id="reread-review" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} placeholder="¿La has vivido igual que la primera vez?" className="min-h-28 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40" />
        </div>

        <button type="button" disabled={saving} onClick={save} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"><Check className="h-4 w-4" />{saving ? "Guardando…" : "Guardar relectura"}</button>
      </DialogContent>
    </Dialog>
  );
}
