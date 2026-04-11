import { useState, useRef, useEffect } from "react";
import { Book } from "@/hooks/useBooks";
import { Trash2, Star, Pencil, ChevronDown, ChevronUp, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { EditBookDialog } from "@/components/EditBookDialog";
import { RichNotesDisplay } from "@/components/RichNotesEditor";
import { BookCoverImage } from "@/components/BookCoverImage";
import { STATUS_LABELS, STATUS_COLORS, GENRE_COLORS, FORMAT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  onUpdate: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void;
  onDelete: (id: string) => void;
  onMoveToWishlist?: (book: Book) => void;
  index: number;
}

// Accent color per status
const STATUS_ACCENT: Record<string, string> = {
  finished: "from-emerald-500/80 to-emerald-600/60",
  reading: "from-blue-500/80 to-blue-600/60",
  "want-to-read": "from-amber-500/80 to-amber-600/60",
};

export function BookCard({ book, onUpdate, onDelete, onMoveToWishlist, index }: BookCardProps) {
  const [editing, setEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
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
    if (val !== book.pagesRead) onUpdate(book.id, { pagesRead: val });
    setPagesPopover(false);
  };

  return (
    <>
      <div
        className="group relative rounded-2xl border border-border/30 bg-card overflow-hidden animate-fade-in hover:border-border/60 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* ── Accent bar ── */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${STATUS_ACCENT[book.status] || "from-primary/60 to-primary/30"}`} />

        <div className="flex gap-3 p-3">
          {/* ── Cover ── */}
          <div className="relative flex-shrink-0 w-[80px] h-[120px] rounded-xl overflow-hidden shadow-md ring-1 ring-white/5">
            <BookCoverImage
              src={book.coverUrl}
              alt={book.title}
              title={book.title}
              className="h-full w-full object-cover"
              iconClassName="h-8 w-8"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {book.status === "reading" && onMoveToWishlist && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); onMoveToWishlist(book); }} title="Mover a Quiero leer">
                  <BookmarkPlus className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* ── Info ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* Title & Author */}
            <div>
              <h3 className="truncate text-[15px] font-semibold leading-snug font-display text-foreground">{book.title}</h3>
              <p className="truncate text-xs text-muted-foreground italic font-display">{book.author}</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1">
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase", STATUS_COLORS[book.status])}>
                {STATUS_LABELS[book.status]}
              </span>
              {book.genre && (
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", GENRE_COLORS[book.genre] || "bg-muted text-muted-foreground")}>
                  {book.genre}
                </span>
              )}
              {book.hasSaga && book.saga && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal font-display">
                  {book.saga}{book.sagaOrder ? ` #${book.sagaOrder}` : ""}
                </Badge>
              )}
            </div>

            {/* Progress bar for reading */}
            {book.status === "reading" && book.totalPages > 0 && (
              <div>
                <Popover open={pagesPopover} onOpenChange={setPagesPopover}>
                  <PopoverTrigger asChild>
                    <button className="flex w-full items-center justify-between text-xs text-muted-foreground mb-1 hover:text-foreground transition-colors cursor-pointer rounded px-0.5">
                      <span className="font-display">{book.pagesRead} / {book.totalPages} pág.</span>
                      <span className="font-bold text-primary text-xs">{progress}%</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-2">
                      <p className="text-xs font-display text-muted-foreground">Páginas leídas</p>
                      <div className="flex items-center gap-2">
                        <Input ref={pagesInputRef} type="number" value={tempPages} onChange={(e) => setTempPages(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handlePagesSubmit(); }} min={0} max={book.totalPages} className="h-8 text-sm" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">/ {book.totalPages}</span>
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handlePagesSubmit}>Guardar</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Progress value={progress} className="h-1.5 rounded-full" />
              </div>
            )}

            {/* Stars for finished */}
            {book.status === "finished" && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={cn("h-3.5 w-3.5 transition-colors", star <= book.rating ? "fill-[hsl(var(--warm-gold))] text-[hsl(var(--warm-gold))]" : "text-muted-foreground/15")} />
                  ))}
                </div>
                {book.totalPages > 0 && <span className="text-[10px] text-muted-foreground ml-1 font-display">{book.totalPages} pág.</span>}
              </div>
            )}

            {/* Dates */}
            {(book.startDate || book.endDate) && (
              <p className="text-[10px] text-muted-foreground/60 font-display">
                {book.startDate && `${new Date(book.startDate + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}`}
                {book.startDate && book.endDate && " → "}
                {book.endDate && `${new Date(book.endDate + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}`}
              </p>
            )}
          </div>
        </div>

        {/* ── Bottom strip: format + Ver más ── */}
        <div className="px-3 pb-3 flex items-center justify-between gap-1">
          <div className="flex flex-wrap gap-1">
            {book.format && (
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", FORMAT_COLORS[book.format] || "bg-muted text-muted-foreground")}>
                {book.format}
              </span>
            )}
            {book.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-border/50 font-display">{tag}</Badge>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDetail(!showDetail); }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0 font-display"
          >
            {showDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{showDetail ? "Ocultar" : "Ver más"}</span>
          </button>
        </div>

        {/* ── Detail panel ── */}
        {showDetail && (
          <div className="border-t border-border/20 bg-muted/10 px-3 py-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-display">
              {book.price && (
                <>
                  <span className="text-muted-foreground">Precio</span>
                  <span className="text-foreground font-medium">{book.price} €</span>
                </>
              )}
              {book.source && (
                <>
                  <span className="text-muted-foreground">Procedencia</span>
                  <span className="text-foreground font-medium">{book.source}</span>
                </>
              )}
              {book.totalPages > 0 && book.status !== "reading" && (
                <>
                  <span className="text-muted-foreground">Páginas</span>
                  <span className="text-foreground font-medium">{book.totalPages}</span>
                </>
              )}
              {book.hasSaga && book.saga && (
                <>
                  <span className="text-muted-foreground">Saga</span>
                  <span className="text-foreground font-medium">{book.saga}{book.sagaOrder ? ` #${book.sagaOrder}` : ""}</span>
                </>
              )}
              {(book.startDate || book.endDate) && (
                <>
                  <span className="text-muted-foreground">Fechas</span>
                  <span className="text-foreground font-medium">
                    {book.startDate && new Date(book.startDate + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    {book.startDate && book.endDate && " → "}
                    {book.endDate && new Date(book.endDate + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                  </span>
                </>
              )}
            </div>
            {book.notes && (
              <div className="border-t border-border/20 pt-2">
                <p className="text-[11px] text-muted-foreground mb-1.5 font-display">Notas</p>
                <RichNotesDisplay text={book.notes} />
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <EditBookDialog book={book} open={editing} onOpenChange={setEditing} onSave={onUpdate} />
      )}
    </>
  );
}
