import { useEffect, useState } from "react";
import { useBooksContext } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Sparkles, Trash2, X } from "lucide-react";

type Collection = { id: string; name: string; description: string; emoji: string; color: string; created_at: string };
type CollectionBook = { collection_id: string; book_id: string };
const COLORS = ["#f59e0b", "#ef6c4f", "#e879a9", "#a78bfa", "#14b8a6", "#60a5fa", "#84cc16"];
const EMOJIS = ["✦", "❄", "♥", "☾", "✿", "⚔", "☕"];
const db = supabase as any;

export default function Collections() {
  const { books } = useBooksContext();
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [links, setLinks] = useState<CollectionBook[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("✦"); const [color, setColor] = useState(COLORS[4]);

  const load = async () => {
    if (!user) return;
    const { data: items } = await db.from("collections").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setCollections(items || []);
    const { data: assigned } = await db.from("collection_books").select("collection_id, book_id");
    setLinks(assigned || []);
  };
  useEffect(() => { load(); }, [user?.id]);
  const countFor = (id: string) => links.filter((link) => link.collection_id === id).length;
  const booksFor = (id: string) => links.filter((link) => link.collection_id === id).map((link) => books.find((book) => book.id === link.book_id)).filter(Boolean).slice(0, 4);
  const create = async () => {
    if (!user || !name.trim()) return;
    await db.from("collections").insert({ user_id: user.id, name: name.trim(), description: description.trim(), emoji, color });
    setName(""); setDescription(""); setEmoji("✦"); setColor(COLORS[4]); setOpen(false); load();
  };
  const remove = async (id: string) => { if (window.confirm("¿Eliminar esta colección? Los libros no se borrarán.")) { await db.from("collections").delete().eq("id", id); load(); } };
  const toggleBook = async (collectionId: string, bookId: string) => {
    const exists = links.some((link) => link.collection_id === collectionId && link.book_id === bookId);
    if (exists) await db.from("collection_books").delete().eq("collection_id", collectionId).eq("book_id", bookId);
    else await db.from("collection_books").insert({ collection_id: collectionId, book_id: bookId });
    load();
  };
  const hasCollections = collections.length > 0;
  return <div className="space-y-8 pb-8">
    <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 18% 32%, var(--primary) 0 1px, transparent 1.5px), radial-gradient(circle at 78% 16%, var(--primary) 0 1px, transparent 1.5px)", backgroundSize: "90px 90px, 120px 120px" }} />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-primary"><Sparkles className="h-4 w-4" /> Capítulo I · reúne</p><h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Tus colecciones</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Crea rincones para las historias que comparten algo especial.</p></div><button onClick={() => setOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Nueva colección</button></div>
    </section>
    {!hasCollections ? <div className="rounded-3xl border border-dashed border-primary/30 bg-card/50 px-6 py-16 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">✦</div><h3 className="mt-5 font-display text-2xl font-semibold">Empieza tu primer rincón</h3><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Navidad, romance, fantasía acogedora… tus libros pueden pertenecer a todas las historias que quieras.</p><button onClick={() => setOpen(true)} className="mt-6 text-sm font-semibold text-primary hover:underline">Crear colección</button></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{collections.map((collection) => { const covers = booksFor(collection.id); return <article key={collection.id} className="group relative overflow-hidden rounded-3xl border border-border/45 bg-card p-5 transition-transform hover:-translate-y-1"><div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: collection.color }} /><button onClick={() => remove(collection.id)} aria-label={`Eliminar ${collection.name}`} className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button><div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl" style={{ backgroundColor: `${collection.color}22`, color: collection.color }}>{collection.emoji}</div><div className="min-w-0"><h3 className="font-display text-xl font-semibold">{collection.name}</h3><p className="mt-1 text-xs text-muted-foreground">{countFor(collection.id)} libro{countFor(collection.id) === 1 ? "" : "s"}</p></div></div>{collection.description && <p className="mt-4 min-h-10 text-sm text-muted-foreground">{collection.description}</p>}<div className="mt-5 flex h-24 items-end gap-2">{covers.length ? covers.map((book: any) => <img key={book.id} src={book.coverUrl} alt="" className="h-24 w-16 rounded-md object-cover shadow-lg" />) : <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground"><BookOpen className="mr-2 h-4 w-4" /> Aún no hay libros</div>}</div><details className="mt-4"><summary className="cursor-pointer text-xs font-semibold text-primary">Gestionar libros</summary><div className="mt-3 max-h-40 space-y-1 overflow-y-auto pr-1">{books.map((book) => { const selected = links.some((link) => link.collection_id === collection.id && link.book_id === book.id); return <button key={book.id} type="button" onClick={() => toggleBook(collection.id, book.id)} className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs ${selected ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}><span className="truncate">{book.title}</span><span>{selected ? "✓" : "+"}</span></button>; })}</div></details></article>; })}</div>}
    {open && <div className="fixed inset-0 z-[100] grid place-items-center p-4"><button className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Cerrar" onClick={() => setOpen(false)} /><div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"><button className="absolute right-4 top-4 p-2 text-muted-foreground" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Nuevo capítulo</p><h3 className="mt-2 font-display text-2xl font-semibold">Crea una colección</h3><div className="mt-5 space-y-4"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Libros de Navidad" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" /><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Una pequeña descripción opcional" className="min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" /><div className="flex gap-2">{EMOJIS.map((item) => <button key={item} onClick={() => setEmoji(item)} className={`grid h-9 w-9 place-items-center rounded-lg ${emoji === item ? "bg-primary/20 ring-1 ring-primary" : "bg-muted"}`}>{item}</button>)}</div><div className="flex gap-2">{COLORS.map((item) => <button key={item} aria-label={item} onClick={() => setColor(item)} className={`h-7 w-7 rounded-full ${color === item ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`} style={{ background: item }} />)}</div><button disabled={!name.trim()} onClick={create} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">Crear colección</button></div></div></div>}
  </div>;
}
