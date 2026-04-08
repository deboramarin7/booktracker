import { useState } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem, WishStatus } from "@/hooks/useWishlist";
import { Heart, Plus, Pencil, Trash2, BookHeart, BookOpen, Loader as Loader2, Search, Filter, BookMarked, Flame } from "lucide-react";
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
import { GENRE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const GENRES = ["Contemporáneo", "Fantasía", "Ficción", "Romántica", "Romantasy", "Sport Romance", "Thriller"];
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

export default function WishList() {
  return <WishListContent />;
}

function WishCard({ item, updateItem, deleteItem, onMoveToLibrary }: { item: WishItem; updateItem: (id: string, data: Omit<WishItem, "id">) => void; deleteItem: (id: string) => void; onMoveToLibrary: (item: WishItem) => void }) {
  const isTopPriority = item.priority >= 5;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md border-border/30",
      isTopPriority && "ring-1 ring-red-500/20 border-red-500/10"
    )}>
      <CardContent className="p-4 space-y-3">
        {isTopPriority && (
          <div className="flex items-center gap-1 mb-1">
            <Flame className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Must read</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <BookCoverImage
            src={item.coverUrl}
            alt={item.title}
            className="w-14 h-20 object-cover rounded-lg shadow-sm shrink-0"
            fallbackClassName="w-14 h-20 rounded-lg shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold leading-tight">{item.title}</p>
                <p className="text-sm text-muted-foreground font-body">{item.author}</p>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <WishForm
                  initial={item}
                  onSave={(data) => updateItem(item.id, data)}
                  trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {item.hasSaga && item.saga && (
              <p className="text-xs text-muted-foreground font-body mt-1">
                📚 {item.saga} {item.sagaOrder && `#${item.sagaOrder}`}
              </p>
            )}
            {item.totalPages > 0 && (
              <p className="text-[11px] text-muted-foreground/70 font-body">{item.totalPages} páginas</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1.5 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${GENRE_COLORS[item.genre] || "bg-muted text-muted-foreground"}`}>
                  {item.genre}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <Hearts value={item.priority} onChange={(v) => updateItem(item.id, { ...item, priority: v })} />
            </div>
          </div>
        </div>
        {/* CTA: Empezar a leer — always visible */}
        <Button
          size="sm"
          variant={isTopPriority ? "default" : "outline"}
          className={cn(
            "w-full text-xs gap-1.5",
            isTopPriority
              ? "bg-primary hover:bg-primary/90"
              : "border-primary/30 text-primary hover:bg-primary/10"
          )}
          onClick={() => onMoveToLibrary(item)}
        >
          <BookMarked className="h-3.5 w-3.5" />
          Empezar a leer
        </Button>
      </CardContent>
    </Card>
  );
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

  const handleMoveToLibrary = async (item: WishItem) => {
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
    toast({ title: "📖 Movido a biblioteca", description: `"${item.title}" ahora está en Leyendo` });
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

  // Sort by priority DESC, then by saga, then alphabetically
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Priority first (highest first)
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

  // Build saga groups
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-display font-bold">Wish List</h2>
          <span className="text-sm text-muted-foreground font-body">({items.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setFilterPriority(filterPriority === v ? null : v)}
              className={`p-1 rounded transition-colors ${filterPriority && v <= filterPriority ? "bg-red-100 dark:bg-red-900/30" : "hover:bg-secondary"}`}
            >
              <Heart className={`h-4 w-4 ${filterPriority && v <= filterPriority ? "fill-red-500 text-red-500" : "text-muted-foreground/40"}`} />
            </button>
          ))}
          {filterPriority && (
            <button onClick={() => setFilterPriority(null)} className="text-xs text-muted-foreground ml-1 hover:text-foreground">✕</button>
          )}
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título, autor o saga..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-body" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-[150px] h-8 text-xs font-body">
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los géneros</SelectItem>
              {genreNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-8 text-xs font-body">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sagaFilter} onValueChange={setSagaFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs font-body">
              <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Saga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="individual">📖 Individuales</SelectItem>
              {sagaNames.map((s) => (
                <SelectItem key={s} value={s}>📚 {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterGenre !== "all" || filterStatus !== "all" || filterPriority || sagaFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => { setFilterGenre("all"); setFilterStatus("all"); setFilterPriority(null); setSagaFilter("all"); }}
            >
              Limpiar filtros ✕
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <BookHeart className="h-10 w-10 text-primary/30" />
          </div>
          <p className="text-xl text-muted-foreground font-display">Tu wish list está vacía</p>
          <p className="text-sm text-muted-foreground/60 mt-2 font-body">Añade libros que quieras leer</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Saga groups */}
          {Array.from(sagaGroups.entries()).map(([sagaName, sagaItems]) => (
            <div key={sagaName}>
              <h3 className="text-sm font-display font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground">
                📚 Saga: {sagaName} <span className="text-xs font-normal">({sagaItems.length})</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sagaItems.map((item) => (
                  <WishCard key={item.id} item={item} updateItem={updateItem} deleteItem={deleteItem} onMoveToLibrary={handleMoveToLibrary} />
                ))}
              </div>
            </div>
          ))}

          {/* Standalone books */}
          {standalone.length > 0 && (
            <div>
              {sagaGroups.size > 0 && (
                <h3 className="text-sm font-display font-semibold mb-3 text-muted-foreground">📖 Libros individuales ({standalone.length})</h3>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {standalone.map((item) => (
                  <WishCard key={item.id} item={item} updateItem={updateItem} deleteItem={deleteItem} onMoveToLibrary={handleMoveToLibrary} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
