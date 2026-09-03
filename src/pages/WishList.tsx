import { useState } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem, WishStatus } from "@/hooks/useWishlist";
import { Heart, Plus, Pencil, Trash2, BookHeart, BookOpen, Loader as Loader2, Search, Filter, BookMarked, Flame, Library, Sparkles, SlidersHorizontal } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import { useBooksContext } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GENRE_COLORS, GENRES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUSES: WishStatus[] = ["Comprado", "Buscar", "En biblioteca", "En kindle"];

function Hearts({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Heart
          key={i}
          className={`h-4 w-4 cursor-pointer transition-colors ${i <= value ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

const statusColors: Record<WishStatus, string> = {
  "Comprado": "bg-green-500/10 text-green-700 border-green-500/20",
  "Buscar": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "En biblioteca": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "En kindle": "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

function WishForm({ initial, onSave, trigger }: {
  initial?: WishItem;
  onSave: (data: Omit<WishItem, "id">) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const [hasSaga, setHasSaga] = useState(initial?.hasSaga || false);
  const [saga, setSaga] = useState(initial?.saga || "");
  const [sagaOrder, setSagaOrder] = useState(initial?.sagaOrder || "");
  const [genre, setGenre] = useState(initial?.genre || GENRES[0]);
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [status, setStatus] = useState<WishStatus>(initial?.status || "Buscar");
  const [totalPages, setTotalPages] = useState(String(initial?.totalPages || ""));

  const reset = () => {
    setTitle(initial?.title || ""); setAuthor(initial?.author || "");
    setCoverUrl(initial?.coverUrl || "");
    setHasSaga(initial?.hasSaga || false); setSaga(initial?.saga || "");
    setSagaOrder(initial?.sagaOrder || ""); setGenre(initial?.genre || GENRES[0]);
    setPriority(initial?.priority || 3); setStatus(initial?.status || "Buscar");
    setTotalPages(String(initial?.totalPages || ""));
  };

  const handleSubmit = () => {
    if (!title.trim() || !author.trim()) return;
    onSave({ title: title.trim(), author: author.trim(), coverUrl: coverUrl.trim() || undefined, hasSaga, saga: hasSaga ? saga : undefined, sagaOrder: hasSaga ? sagaOrder : undefined, genre, priority, status, totalPages: parseInt(totalPages) || 0 });
    setOpen(false);
    if (!initial) reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Editar" : "Añadir a"} Wish List</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Autor/a *</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
          <div><Label>URL de portada</Label><Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="flex items-center gap-2">
            <Label>¿Pertenece a una saga?</Label>
            <Switch checked={hasSaga} onCheckedChange={setHasSaga} />
          </div>
          {hasSaga && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre de la saga</Label><Input value={saga} onChange={(e) => setSaga(e.target.value)} /></div>
              <div><Label>Orden</Label><Input value={sagaOrder} onChange={(e) => setSagaOrder(e.target.value)} placeholder="Ej: 1" /></div>
            </div>
          )}
          <div>
            <Label>Género</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridad</Label>
            <Hearts value={priority} onChange={setPriority} />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as WishStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Páginas totales</Label><Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="Ej: 350" min={0} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={!title.trim() || !author.trim()}>
            {initial ? "Guardar" : "Añadir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WishCoverCard({ item, updateItem, deleteItem, onMoveToLibrary }: {
  item: WishItem;
  updateItem: (id: string, data: Omit<WishItem, "id">) => void;
  deleteItem: (id: string) => void;
  onMoveToLibrary: (item: WishItem) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const isTopPriority = item.priority >= 5;

  return (
    <>
      <div className="group cursor-pointer" onClick={() => setShowDetail(true)}>
        <div className="aspect-[2/3] rounded-[var(--radius)] overflow-hidden bg-muted mb-2 book-3d relative">
          <BookCoverImage
            src={item.coverUrl}
            alt={item.title}
            title={item.title}
            className="w-full h-full object-cover"
            iconClassName="h-10 w-10"
          />
          {/* Priority badge */}
          {isTopPriority && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-200 rounded-full backdrop-blur-sm flex items-center gap-1">
                <Flame className="h-3 w-3" /> Must read
              </span>
            </div>
          )}
          {/* Status badge */}
          <div className={`absolute ${isTopPriority ? "top-8" : "top-2"} left-2`}>
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full backdrop-blur-sm ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>
          {/* Hover overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <WishForm
              initial={item}
              onSave={(data) => updateItem(item.id, data)}
              trigger={
                <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              }
            />
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Eliminar "${item.title}"?`)) deleteItem(item.id); }}
              className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <h3 className="text-sm font-semibold truncate font-body">{item.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{item.author}</p>
        {item.hasSaga && item.saga && (
          <p className="text-[10px] text-primary truncate mt-0.5">{item.saga} #{item.sagaOrder}</p>
        )}
        <div className="mt-1">
          <Hearts value={item.priority} />
        </div>
      </div>

      {/* Detail modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex gap-4">
              <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-md">
                <BookCoverImage src={item.coverUrl} alt={item.title} title={item.title} className="w-full h-full object-cover" iconClassName="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg font-display leading-tight text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.author}</p>
                {item.hasSaga && item.saga && (
                  <p className="text-xs text-primary mt-1">{item.saga} #{item.sagaOrder}</p>
                )}
                <div className="mt-2">
                  <Hearts value={item.priority} onChange={(v) => updateItem(item.id, { ...item, priority: v })} />
                </div>
              </div>
            </div>
            {/* Details */}
            <div className="grid grid-cols-2 gap-2 text-sm border-t border-border/40 pt-3">
              {item.genre && <><span className="text-muted-foreground">Género</span><span className="text-foreground font-medium">{item.genre}</span></>}
              <><span className="text-muted-foreground">Estado</span><span className={`font-medium ${statusColors[item.status]} px-2 py-0.5 rounded-full text-xs inline-block w-fit`}>{item.status}</span></>
              {item.totalPages > 0 && <><span className="text-muted-foreground">Páginas</span><span className="text-foreground font-medium">{item.totalPages}</span></>}
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveToLibrary(item); setShowDetail(false); }}
                className="w-full h-10 rounded-[var(--radius)] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <BookMarked className="h-4 w-4" />
                Empezar a leer
              </button>
              <div className="flex gap-2">
                <WishForm
                  initial={item}
                  onSave={(data) => { updateItem(item.id, data); setShowDetail(false); }}
                  trigger={
                    <button onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-[var(--radius)] border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors text-foreground">
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                  }
                />
                <button onClick={() => setShowDetail(false)} className="flex-1 h-9 rounded-[var(--radius)] border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors text-foreground">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function WishList() {
  return <WishListContent />;
}

function WishListContent() {
  const { items, loading, addItem, updateItem, deleteItem } = useWishlist();
  const { addBook } = useBooksContext();
  const { toast } = useToast();
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sagaFilter, setSagaFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleMoveToLibrary = async (item: WishItem) => {
    try {
      await addBook({
        title: item.title,
        author: item.author,
        coverUrl: item.coverUrl,
        hasSaga: item.hasSaga,
        saga: item.saga,
        sagaOrder: item.sagaOrder,
        genre: item.genre,
        format: "",
        source: "",
        status: "reading",
        totalPages: item.totalPages || 0,
        pagesRead: 0,
        rating: 0,
        notes: "",
        tags: [],
      });
      await deleteItem(item.id);
      toast({ title: "Movido a biblioteca", description: `"${item.title}" ahora está en Leyendo` });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo mover el libro", variant: "destructive" });
    }
  };

  const sagaNames = [...new Set(items.filter(i => i.hasSaga && i.saga).map(i => i.saga!))].sort((a, b) => a.localeCompare(b, "es"));

  const genreNames = [...new Set(items.filter(i => i.genre).map(i => i.genre))].sort((a, b) => a.localeCompare(b, "es"));

  const filteredItems = items
    .filter(i => !filterPriority || i.priority === filterPriority)
    .filter(i => filterGenre === "all" || i.genre === filterGenre)
    .filter(i => filterStatus === "all" || i.status === filterStatus)
    .filter(i => {
      if (sagaFilter === "all") return true;
      if (sagaFilter === "individual") return !i.hasSaga || !i.saga;
      return i.saga === sagaFilter;
    })
    .filter(i =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.author.toLowerCase().includes(search.toLowerCase()) ||
      (i.saga && i.saga.toLowerCase().includes(search.toLowerCase()))
    );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const sagaA = a.hasSaga && a.saga ? a.saga.toLowerCase() : "";
    const sagaB = b.hasSaga && b.saga ? b.saga.toLowerCase() : "";
    if (sagaA && sagaB && sagaA !== sagaB) return sagaA.localeCompare(sagaB, "es");
    if (sagaA && !sagaB) return -1;
    if (!sagaA && sagaB) return 1;
    if (sagaA && sagaB && sagaA === sagaB) {
      const orderA = parseInt(a.sagaOrder || "0") || 0;
      const orderB = parseInt(b.sagaOrder || "0") || 0;
      if (orderA !== orderB) return orderA - orderB;
    }
    return a.title.localeCompare(b.title, "es");
  });

  const sagaGroups = new Map<string, WishItem[]>();
  const standalone: WishItem[] = [];
  sortedItems.forEach((item) => {
    if (item.hasSaga && item.saga) {
      const key = item.saga;
      if (!sagaGroups.has(key)) sagaGroups.set(key, []);
      sagaGroups.get(key)!.push(item);
    } else {
      standalone.push(item);
    }
  });
  const mustReadCount = items.filter((item) => item.priority >= 5).length;
  const ownedCount = items.filter((item) => item.status === "Comprado" || item.status === "En kindle" || item.status === "En biblioteca").length;
  const activeFilterCount = [filterPriority !== null, filterGenre !== "all", filterStatus !== "all", sagaFilter !== "all"].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-rose-400/20 bg-card px-5 py-7 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400"><Sparkles className="h-3.5 w-3.5" /> Próximas obsesiones</p><div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Wish List</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Los mundos que todavía no has abierto, pero que ya tienen un hueco reservado para ti.</p></div><WishForm onSave={addItem} trigger={<button className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/90"><Plus className="h-4 w-4" /> Añadir deseo</button>} /></div>
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border/40 pt-5"><div><p className="font-display text-2xl font-semibold">{items.length}</p><p className="text-xs text-muted-foreground">por descubrir</p></div><div><p className="font-display text-2xl font-semibold text-rose-400">{mustReadCount}</p><p className="text-xs text-muted-foreground">must read</p></div><div><p className="font-display text-2xl font-semibold">{ownedCount}</p><p className="text-xs text-muted-foreground">ya contigo</p></div></div>
          <label className="mt-5 flex h-14 max-w-2xl items-center gap-3 rounded-2xl border border-border/50 bg-background/60 px-4 transition-colors focus-within:border-rose-400/70 focus-within:ring-2 focus-within:ring-rose-400/15"><Search className="h-5 w-5 text-muted-foreground" /><input placeholder="Busca por título, autor o saga" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Buscar en Wish List" />{search && <button type="button" onClick={() => setSearch("")} className="text-xs font-medium text-primary hover:underline">Limpiar</button>}</label></div>
      </section>

      <div className="flex items-center justify-between border-y border-border/40 py-4"><div className="flex items-center gap-1"><span className="mr-2 text-sm text-muted-foreground">Prioridad</span>{[1, 2, 3, 4, 5].map((v) => <button key={v} type="button" onClick={() => setFilterPriority(filterPriority === v ? null : v)} aria-label={`Filtrar por ${v} corazones`} aria-pressed={filterPriority === v} className={`rounded-lg p-1.5 transition-colors ${filterPriority && v <= filterPriority ? "bg-rose-500/15" : "hover:bg-secondary"}`}><Heart className={`h-4 w-4 ${filterPriority && v <= filterPriority ? "fill-rose-400 text-rose-400" : "text-muted-foreground/40"}`} /></button>)}</div><button type="button" onClick={() => setShowFilters((visible) => !visible)} aria-expanded={showFilters} className="flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-card px-3 text-sm font-medium hover:border-primary/50"><SlidersHorizontal className="h-4 w-4" /> Filtros {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{activeFilterCount}</span>}</button></div>

      {showFilters && <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-card/60 p-3">
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger aria-label="Filtrar por género" className="w-full sm:w-[180px] h-10 text-xs font-body">
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los géneros</SelectItem>
              {genreNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger aria-label="Filtrar por estado" className="w-full sm:w-[180px] h-10 text-xs font-body">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sagaFilter} onValueChange={setSagaFilter}>
            <SelectTrigger aria-label="Filtrar por saga" className="w-full sm:w-[180px] h-10 text-xs font-body">
              <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Saga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="individual">Individuales</SelectItem>
              {sagaNames.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => { setFilterGenre("all"); setFilterStatus("all"); setFilterPriority(null); setSagaFilter("all"); }}
            >
              Limpiar filtros
            </Button>
          )}
      </div>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
              <BookHeart className="h-10 w-10 text-primary/40" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-semibold font-display text-foreground">Tu lista de deseos está vacía</p>
            <p className="text-sm text-muted-foreground font-display max-w-xs mx-auto">
              "Una casa sin libros es como un cuerpo sin alma." - Cicerón
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Saga groups */}
          {Array.from(sagaGroups.entries()).map(([sagaName, sagaItems]) => (
            <div key={sagaName}>
              <h3 className="text-sm font-display font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground">
                Saga: {sagaName} <span className="text-xs font-normal">({sagaItems.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {sagaItems.map((item) => (
                  <WishCoverCard key={item.id} item={item} updateItem={updateItem} deleteItem={deleteItem} onMoveToLibrary={handleMoveToLibrary} />
                ))}
              </div>
            </div>
          ))}

          {/* Standalone books */}
          {standalone.length > 0 && (
            <div>
              {sagaGroups.size > 0 && (
                <h3 className="text-sm font-display font-semibold mb-3 text-muted-foreground">Libros individuales ({standalone.length})</h3>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {standalone.map((item) => (
                  <WishCoverCard key={item.id} item={item} updateItem={updateItem} deleteItem={deleteItem} onMoveToLibrary={handleMoveToLibrary} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
