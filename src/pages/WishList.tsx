import { useState, useMemo } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem } from "@/hooks/useWishlist";
import {
  Heart, Plus, Pencil, Trash2, BookOpen, Search, X,
  BookHeart, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const GENRES = [
  "Fantasía","Ciencia Ficción","Romance","Misterio","Thriller",
  "Terror","Histórica","Contemporánea","Aventura","Otros",
];

const STATUS_LABELS: Record<string, string> = {
  Buscar: "Por buscar", Conseguido: "Conseguido", Prestado: "Prestado",
};

function WishItemForm({ open, onOpenChange, initial, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  initial?: WishItem; onSave: (data: Omit<WishItem, "id">) => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const [hasSaga, setHasSaga] = useState(initial?.hasSaga || false);
  const [saga, setSaga] = useState(initial?.saga || "");
  const [sagaOrder, setSagaOrder] = useState(initial?.sagaOrder || "");
  const [genre, setGenre] = useState(initial?.genre || GENRES[0]);
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [synopsis, setSynopsis] = useState(initial?.synopsis || "");
  const [status, setStatus] = useState<"Buscar"|"Conseguido"|"Prestado">(initial?.status as any || "Buscar");
  const [totalPages, setTotalPages] = useState(String(initial?.totalPages || ""));

  const handleSubmit = () => {
    if (!title.trim() || !author.trim()) return;
    onSave({ title: title.trim(), author: author.trim(), coverUrl: coverUrl.trim() || undefined,
      hasSaga, saga: hasSaga ? saga : undefined, sagaOrder: hasSaga ? sagaOrder : undefined,
      genre, priority, synopsis: synopsis.trim() || undefined, status,
      totalPages: parseInt(totalPages) || 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar libro" : "Añadir a Wish List"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del libro" /></div>
          <div><Label>Autor *</Label><Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Nombre del autor" /></div>
          <div><Label>URL portada</Label><Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." /></div>
          <div>
            <Label>Género</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="hasSaga" checked={hasSaga} onChange={e => setHasSaga(e.target.checked)} className="rounded" />
            <Label htmlFor="hasSaga">¿Pertenece a una saga?</Label>
          </div>
          {hasSaga && (
            <div className="flex gap-2">
              <div className="flex-1"><Label>Saga</Label><Input value={saga} onChange={e => setSaga(e.target.value)} /></div>
              <div className="w-20"><Label>Nº</Label><Input value={sagaOrder} onChange={e => setSagaOrder(e.target.value)} /></div>
            </div>
          )}
          <div>
            <Label>Sinopsis</Label>
            <Textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} placeholder="¿De qué va el libro?" className="resize-none" rows={3} />
          </div>
          <div>
            <Label>Prioridad</Label>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setPriority(n)} className="transition-transform hover:scale-110">
                  <Heart size={22} className={n <= priority ? "fill-rose-500 text-rose-500" : "text-muted-foreground/40"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Buscar">Por buscar</SelectItem>
                <SelectItem value="Conseguido">Conseguido</SelectItem>
                <SelectItem value="Prestado">Prestado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Páginas totales</Label><Input type="number" value={totalPages} onChange={e => setTotalPages(e.target.value)} placeholder="Ej: 350" min={0} /></div>
          <Button onClick={handleSubmit} disabled={!title.trim() || !author.trim()} className="mt-1">
            {initial ? "Guardar cambios" : "Añadir a la lista"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WishDetailPanel({ item, onEdit, onDelete, onClose }: {
  item: WishItem; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Cerrar
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil size={14} className="mr-1" />Editar</Button>
          <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 size={14} className="mr-1" />Borrar</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-24 flex-shrink-0">
            <div className="aspect-[2/3] rounded-lg overflow-hidden border border-border/40 bg-muted/30">
              {item.coverUrl
                ? <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen size={24} className="text-muted-foreground/40" /></div>
              }
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-tight">{item.title}</h2>
            <p className="text-muted-foreground text-sm">{item.author}</p>
            {item.hasSaga && item.saga && (
              <p className="text-xs text-primary/70">{item.saga}{item.sagaOrder ? ` #${item.sagaOrder}` : ""}</p>
            )}
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map(n => (
                <Heart key={n} size={14} className={n <= item.priority ? "fill-rose-500 text-rose-500" : "text-muted-foreground/20"} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm border-t border-border/40 pt-3">
          <div><span className="text-muted-foreground">Género</span><p className="font-medium mt-0.5">{item.genre || "—"}</p></div>
          <div><span className="text-muted-foreground">Estado</span><p className="font-medium mt-0.5">{STATUS_LABELS[item.status] || item.status}</p></div>
          {item.totalPages > 0 && (
            <div><span className="text-muted-foreground">Páginas</span><p className="font-medium mt-0.5">{item.totalPages.toLocaleString("es-ES")}</p></div>
          )}
        </div>
        {item.synopsis && (
          <div className="border-t border-border/40 pt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sinopsis</p>
            <p className="text-sm leading-relaxed text-foreground/80">{item.synopsis}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WishList() {
  const { items: wishItems, addItem: addWishItem, updateItem: updateWishItem, deleteItem: deleteWishItem } = useWishlist();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<WishItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<WishItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<WishItem | null>(null);

  const filtered = useMemo(() => wishItems.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.author.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  }), [wishItems, search, statusFilter]);

  const handleSave = (data: Omit<WishItem, "id">) => {
    if (editItem) {
      updateWishItem(editItem.id, data);
      if (selectedItem?.id === editItem.id) setSelectedItem({ ...editItem, ...data });
    } else {
      addWishItem(data);
    }
    setEditItem(undefined);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <BookHeart className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-display">Wish List</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{wishItems.length}</span>
        </div>
        <Button onClick={() => { setEditItem(undefined); setFormOpen(true); }}>
          <Plus size={16} className="mr-1" /> Añadir libro
        </Button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título o autor..." className="pl-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Buscar">Por buscar</SelectItem>
            <SelectItem value="Conseguido">Conseguido</SelectItem>
            <SelectItem value="Prestado">Prestado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {wishItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <BookHeart size={48} className="text-muted-foreground/30" />
          <div>
            <p className="text-lg font-medium text-muted-foreground">Tu lista de deseos está vacía</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Añade los libros que quieres leer</p>
          </div>
          <Button onClick={() => { setEditItem(undefined); setFormOpen(true); }}>
            <Plus size={16} className="mr-1" /> Añadir primer libro
          </Button>
        </div>
      )}

      {wishItems.length > 0 && (
        <div className={`flex gap-6 ${selectedItem ? "flex-col lg:flex-row" : ""}`}>
          <div className={`${selectedItem ? "lg:w-[55%]" : "w-full"}`}>
            {filtered.length === 0
              ? <p className="text-center text-muted-foreground py-12">No hay resultados</p>
              : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filtered.map(item => (
                    <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedItem(item)}>
                      <div className={`relative aspect-[2/3] rounded-[var(--radius)] overflow-hidden border transition-all duration-200 ${selectedItem?.id === item.id ? "border-primary shadow-lg shadow-primary/20" : "border-border/40 group-hover:border-primary/40 group-hover:shadow-md"}`}>
                        {item.coverUrl
                          ? <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 gap-2 p-2">
                              <BookOpen size={24} className="text-muted-foreground/40" />
                              <p className="text-[10px] text-muted-foreground/60 text-center leading-tight line-clamp-3">{item.title}</p>
                            </div>
                        }
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2 gap-2">
                          <button onClick={e => { e.stopPropagation(); setEditItem(item); setFormOpen(true); }}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"><Pencil size={13} /></button>
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget(item); }}
                            className="bg-white/20 hover:bg-rose-500/80 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <p className="text-xs font-semibold line-clamp-1 leading-tight">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{item.author}</p>
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(n => <Heart key={n} size={10} className={n <= item.priority ? "fill-rose-500 text-rose-500" : "text-muted-foreground/20"} />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
          {selectedItem && (
            <div className="lg:w-[45%] lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] border border-border/40 rounded-xl overflow-hidden bg-card">
              <WishDetailPanel
                item={selectedItem}
                onEdit={() => { setEditItem(selectedItem); setFormOpen(true); }}
                onDelete={() => setDeleteTarget(selectedItem)}
                onClose={() => setSelectedItem(null)}
              />
            </div>
          )}
        </div>
      )}

      <WishItemForm open={formOpen} onOpenChange={v => { setFormOpen(v); if (!v) setEditItem(undefined); }} initial={editItem} onSave={handleSave} />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && (deleteWishItem(deleteTarget.id), setDeleteTarget(null), selectedItem?.id === deleteTarget.id && setSelectedItem(null))} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
