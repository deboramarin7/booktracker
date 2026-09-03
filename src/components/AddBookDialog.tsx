import { useState } from "react";
import { TagInput } from "@/components/TagInput";
import { BookSearchGoogle } from "@/components/BookSearchGoogle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, ChevronDown, Image, Plus, Search, Sparkles, Star } from "lucide-react";
import type { ReadingStatus, Book } from "@/hooks/useBooks";
import type { WishItem } from "@/hooks/useWishlist";
import { GENRES, FORMATS, SOURCES, STATUSES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface AddBookDialogProps {
  onAdd: (data: Omit<Book, "id" | "addedAt">) => void;
  onAddToWishlist?: (data: Omit<WishItem, "id">) => void;
}

const STATUS_HINTS: Record<ReadingStatus, { title: string; description: string }> = {
  reading: { title: "Estoy leyendo", description: "Guarda el libro y sigue tu progreso." },
  finished: { title: "Ya lo terminé", description: "Añade fechas y tu valoración." },
  "want-to-read": { title: "Quiero leerlo", description: "Se guardará directamente en tu Wish List." },
};

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/35 bg-muted/[0.16] p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
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
  const [wishStatus, setWishStatus] = useState<"Buscar" | "Comprado" | "En biblioteca" | "En kindle">("Buscar");
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const reset = () => {
    setTitle(""); setAuthor(""); setCoverUrl(""); setSagaName(""); setSagaOrder("");
    setGenre(GENRES[0]); setFormat(FORMATS[0]); setSource(SOURCES[0]); setPrice("");
    setStatus("reading"); setTotalPages(""); setPagesRead("");
    setStartDate(new Date().toISOString().slice(0, 10)); setEndDate(""); setRating("0");
    setTags([]); setWishStatus("Buscar"); setShowCoverEditor(false); setShowMoreDetails(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !author.trim()) return;

    if (status === "want-to-read" && onAddToWishlist) {
      onAddToWishlist({
        title: title.trim(), author: author.trim(), coverUrl: coverUrl.trim() || undefined,
        hasSaga: !!sagaName.trim(), saga: sagaName.trim() || undefined, sagaOrder: sagaOrder.trim() || undefined,
        genre, priority: 3, status: wishStatus, totalPages: Number(totalPages) || 0,
      });
      toast({ title: "Añadido a Wish List", description: `"${title.trim()}" ya está en tu lista de deseos.` });
    } else {
      onAdd({
        title: title.trim(), author: author.trim(), coverUrl: coverUrl.trim() || undefined,
        hasSaga: !!sagaName.trim(), saga: sagaName.trim() || undefined, sagaOrder: sagaOrder.trim() || undefined,
        genre, format, source, price: source === "Comprado" ? price.trim() || undefined : undefined,
        status, totalPages: Number(totalPages) || 0,
        pagesRead: status === "finished" ? (Number(totalPages) || 0) : (Number(pagesRead) || 0),
        startDate: startDate || undefined, endDate: endDate || undefined,
        rating: status === "finished" ? (Number(rating) || 0) : 0, notes: "", tags,
      });
      toast({ title: "Libro añadido", description: `"${title.trim()}" ya forma parte de tu biblioteca.` });
    }
    reset();
    setOpen(false);
  };

  const buttonText = status === "want-to-read" ? "Añadir a Wish List" : "Añadir a mi biblioteca";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 font-body">
          <Plus className="h-5 w-5" />
          Añadir libro
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/35 bg-gradient-to-br from-primary/[0.13] via-background to-background px-5 pb-5 pt-6 sm:px-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl">Una nueva historia</DialogTitle>
              <DialogDescription className="mt-1">Busca el libro o rellena solo los detalles que quieras guardar.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-123px)] overflow-y-auto">
          <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">¿En qué momento está esta lectura?</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["reading", "finished", "want-to-read"] as ReadingStatus[]).map((option) => {
                  const active = status === option;
                  const hint = STATUS_HINTS[option];
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`rounded-2xl border p-3 text-left transition-all ${active ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" : "border-border/45 bg-card hover:border-primary/45 hover:bg-primary/[0.05]"}`}
                    >
                      <span className="block font-display text-sm font-semibold">{hint.title}</span>
                      <span className={`mt-1 block text-[11px] leading-snug ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{hint.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <FormSection title="Encuentra tu libro" description="La búsqueda rellena título, autor, portada y páginas automáticamente.">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 font-body text-sm"><Search className="h-3.5 w-3.5 text-primary" /> Buscar por título, autor o ISBN</Label>
                <BookSearchGoogle onSelect={(result) => {
                  setTitle(result.title);
                  setAuthor(result.author);
                  if (result.coverUrl) setCoverUrl(result.coverUrl);
                  if (result.totalPages) setTotalPages(String(result.totalPages));
                  if (result.sagaName) { setSagaName(result.sagaName); setSagaOrder(result.sagaOrder || ""); }
                }} />
              </div>
            </FormSection>

            <FormSection title="El libro" description="Lo esencial para que encuentre su sitio en tu colección.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="font-body text-sm">Título <span className="text-primary">*</span></Label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título del libro" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-sm">Autor/a <span className="text-primary">*</span></Label>
                  <Input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Nombre del autor/a" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-sm">Género</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENRES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <button type="button" onClick={() => setShowCoverEditor((value) => !value)} className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80">
                <Image className="h-3.5 w-3.5" />
                {showCoverEditor ? "Ocultar edición de portada" : "Editar portada manualmente"}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCoverEditor ? "rotate-180" : ""}`} />
              </button>
              {showCoverEditor && (
                <div className="mt-3 animate-fade-in space-y-1.5">
                  <Label className="font-body text-sm">URL de portada</Label>
                  <Input value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="https://..." />
                </div>
              )}
            </FormSection>

            <FormSection title={status === "want-to-read" ? "Para tu Wish List" : "Tu edición"} description={status === "want-to-read" ? "Unos pocos detalles y ya estará guardado." : "Cómo es el ejemplar que tienes entre manos."}>
              <div className="grid gap-4 sm:grid-cols-2">
                {status !== "want-to-read" && (
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm">Formato</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMATS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="font-body text-sm">{status === "want-to-read" ? "Estado en Wish List" : "Páginas totales"}</Label>
                  {status === "want-to-read" ? (
                    <Select value={wishStatus} onValueChange={(value) => setWishStatus(value as typeof wishStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buscar">Buscar</SelectItem><SelectItem value="Comprado">Comprado</SelectItem>
                        <SelectItem value="En biblioteca">En biblioteca</SelectItem><SelectItem value="En kindle">En Kindle</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : <Input type="number" value={totalPages} onChange={(event) => setTotalPages(event.target.value)} placeholder="350" min={0} />}
                </div>
                {status === "want-to-read" && (
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm">Páginas totales</Label>
                    <Input type="number" value={totalPages} onChange={(event) => setTotalPages(event.target.value)} placeholder="350" min={0} />
                  </div>
                )}
                {status !== "want-to-read" && (
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm">Procedencia</Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SOURCES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                {status !== "want-to-read" && source === "Comprado" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <Label className="font-body text-sm">Precio</Label>
                    <Input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="22,90 €" />
                  </div>
                )}
              </div>
            </FormSection>

            {status !== "want-to-read" && (
              <FormSection title="Tu lectura" description={status === "finished" ? "Cierra el capítulo con tus fechas y valoración." : "Un pequeño punto de partida para tu progreso."}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {status === "reading" && (
                    <div className="space-y-1.5">
                      <Label className="font-body text-sm">Páginas leídas</Label>
                      <Input type="number" value={pagesRead} onChange={(event) => setPagesRead(event.target.value)} placeholder="0" min={0} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm">Fecha de inicio</Label>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="[color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  {status === "finished" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="font-body text-sm">Fecha de fin</Label>
                        <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="[color-scheme:light] dark:[color-scheme:dark]" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="font-body text-sm">¿Cuánto te gustó?</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(String(value))} aria-label={`${value} estrellas`} className="rounded-md p-1 text-amber-400 transition-transform hover:scale-110">
                            <Star className={`h-6 w-6 ${value <= Number(rating) ? "fill-current" : "text-muted-foreground/35"}`} />
                          </button>)}
                          <span className="ml-2 text-xs text-muted-foreground">{Number(rating) > 0 ? `${rating}/5` : "Sin valorar"}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </FormSection>
            )}

            <div>
              <button type="button" onClick={() => setShowMoreDetails((value) => !value)} className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-sm font-medium text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Saga y etiquetas <span className="text-xs font-normal">opcional</span></span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showMoreDetails ? "rotate-180" : ""}`} />
              </button>
              {showMoreDetails && (
                <div className="mt-2 grid gap-4 rounded-2xl border border-border/35 bg-muted/[0.16] p-4 animate-fade-in sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2"><Label className="font-body text-sm">Nombre de saga</Label><Input value={sagaName} onChange={(event) => setSagaName(event.target.value)} placeholder="Ej.: Empíreo" /></div>
                  <div className="space-y-1.5"><Label className="font-body text-sm">Orden</Label><Input value={sagaOrder} onChange={(event) => setSagaOrder(event.target.value)} placeholder="1" /></div>
                  {status !== "want-to-read" && <div className="space-y-1.5 sm:col-span-3"><Label className="font-body text-sm">Etiquetas</Label><TagInput tags={tags} onChange={setTags} placeholder="vacaciones, recomendado..." /></div>}
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-border/35 bg-background/95 px-5 py-4 backdrop-blur sm:px-7">
            <Button type="submit" className="w-full gap-2 font-body"><Plus className="h-4 w-4" />{buttonText}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

