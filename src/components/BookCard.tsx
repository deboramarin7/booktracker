import { useState, useRef, useEffect } from "react";
import { Book } from "@/hooks/useBooks";
import { Trash2, Star, Pencil, ChevronDown, ChevronUp, BookmarkPlus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { EditBookDialog } from "@/components/EditBookDialog";
import { RichNotesDisplay } from "@/components/RichNotesEditor";
import { STATUS_LABELS, STATUS_COLORS, GENRE_COLORS, FORMAT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  onUpdate: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void;
  onDelete: (id: string) => void;
  onMoveToWishlist?: (book: Book) => void;
  index: number;
}

export function BookCard({ book, onUpdate, onDelete, onMoveToWishlist, index }: BookCardProps) {
  const [editing, setEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [pagesPopover, setPagesPopover] = useState(false);
  const [tempPages, setTempPages] = useState(String(book.pagesRead));
  const pagesInputRef = useRef<HTMLInputElement>(null);
  const progress = book.totalPages > 0 ? Math.round((book.pagesRead / book.totalPages) * 100) : 0;

  useEffect(() => {
    if (pagesPopover) {
      setTempPages(String(book.pagesRead));
      setTimeout(() => pagesInputRef.current?.select(), 50);
    }
  }, [pagesPopover, book.pagesRead]);

  const handlePagesSubmit = () => {
    const val = Math.min(Math.max(0, Number(tempPages) || 0), book.totalPages);
    if (val !== book.pagesRead) {
      onUpdate(book.id, { pagesRead: val });
    }
    setPagesPopover(false);
  };

  return (
    <>
      <div
        className="group relative rounded-xl border border-border/40 bg-card overflow-hidden card-interactive hover:border-primary/30 animate-fade-in"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Status indicator bar */}
        <div className={cn(
          "h-1 w-full",
          book.status === "reading" ? "bg-primary" : "bg-[hsl(var(--finished))]"
        )} />

        <div className="flex gap-4 p-4">
          {/* Cover - larger, with overlay on hover */}
          <div className="relative flex-shrink-0 w-[88px] h-[130px] rounded-lg overflow-hidden shadow-md ring-1 ring-border/20">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                <BookOpen className="h-8 w-8 text-primary/40" />
              </div>
            )}
            {/* Hover overlay with quick actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {book.status === "reading" && onMoveToWishlist && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                  onClick={() => onMoveToWishlist(book)}
                  title="Mover a Quiero leer"
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => onDelete(book.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Title & Author */}
            <div className="mb-2">
              <h3 className="truncate text-base font-semibold leading-tight font-display">{book.title}</h3>
              <p className="truncate text-sm text-muted-foreground">{book.author}</p>
            </div>

            {/* Tags row - compact */}
            <div className="flex flex-wrap gap-1 mb-auto">
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                STATUS_COLORS[book.status]
              )}>
                {STATUS_LABELS[book.status]}
              </span>
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                GENRE_COLORS[book.genre] || "bg-muted text-muted-foreground"
              )}>
                {book.genre}
              </span>
              {book.hasSaga && book.saga && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {book.saga}{book.sagaOrder ? ` #${book.sagaOrder}` : ""}
                </Badge>
              )}
            </div>

            {/* Progress bar for reading */}
            {book.status === "reading" && book.totalPages > 0 && (
              <div className="mt-2">
                <Popover open={pagesPopover} onOpenChange={setPagesPopover}>
                  <PopoverTrigger asChild>
                    <button className="flex w-full items-center justify-between text-xs text-muted-foreground mb-1.5 hover:text-foreground transition-colors cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-muted/50">
                      <span className="font-medium">{book.pagesRead} / {book.totalPages} pág.</span>
                      <span className="font-bold text-primary text-sm">{progress}%</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Páginas leídas</p>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={pagesInputRef}
                          type="number"
                          value={tempPages}
                          onChange={(e) => setTempPages(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handlePagesSubmit(); }}
                          min={0}
                          max={book.totalPages}
                          className="h-8 text-sm"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">/ {book.totalPages}</span>
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handlePagesSubmit}>
                        Guardar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>
            )}

            {/* Rating for finished */}
            {book.status === "finished" && (
              <div className="mt-2 flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4 transition-colors",
                        star <= book.rating
                          ? "fill-[hsl(var(--warm-gold))] text-[hsl(var(--warm-gold))]"
                          : "text-muted-foreground/15"
                      )}
                    />
                  ))}
                </div>
                {book.totalPages > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {book.totalPages} pág.
                  </span>
                )}
              </div>
            )}

            {/* Dates */}
            {(book.startDate || book.endDate) && (
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                {book.startDate && `📅 ${book.startDate}`}
                {book.startDate && book.endDate && " → "}
                {book.endDate && `${book.endDate}`}
              </p>
            )}

            {/* Notes toggle */}
            {book.notes && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>{showNotes ? "Ocultar notas" : "Ver notas"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Format & extra tags - bottom strip */}
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            FORMAT_COLORS[book.format] || "bg-muted text-muted-foreground"
          )}>
            {book.format}
          </span>
          {book.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Expandable notes */}
        {showNotes && book.notes && (
          <div className="px-4 pb-3 border-t border-border/30 bg-muted/20">
            <div className="pt-3">
              <RichNotesDisplay text={book.notes} />
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditBookDialog book={book} open={editing} onOpenChange={setEditing} onSave={onUpdate} />
      )}
    </>
  );
}
