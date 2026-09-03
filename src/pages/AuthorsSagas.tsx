import { useMemo, useState } from "react";
import { useBooksContext } from "@/components/Layout";
import { BookOpen, LibraryBig, Search, Sparkles, UsersRound } from "lucide-react";

type CollectionEntry = { name: string; total: number; titles: string[] };

function Initial({ name, kind }: { name: string; kind: "author" | "saga" }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-lg font-display font-semibold ${kind === "author" ? "border-primary/20 bg-primary/10 text-primary" : "border-amber-200/15 bg-amber-200/10 text-amber-100"}`}>{letter}</div>;
}

function CollectionCard({ entry, kind }: { entry: CollectionEntry; kind: "author" | "saga" }) {
  const label = kind === "author" ? "libros leídos" : "títulos leídos";
  return <article className="group rounded-2xl border border-border/45 bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
    <div className="flex gap-3"><Initial name={entry.name} kind={kind} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h4 className="truncate font-display text-lg font-semibold">{entry.name}</h4><div className="shrink-0 text-right"><p className="font-display text-2xl font-semibold text-primary">{entry.total}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{entry.titles.slice(0, 3).map((title) => <span key={title} className="max-w-full truncate rounded-full border border-border/40 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">{title}</span>)}{entry.titles.length > 3 && <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">+{entry.titles.length - 3}</span>}</div></div></div>
  </article>;
}

function EmptyState({ kind }: { kind: "author" | "saga" }) {
  const isAuthor = kind === "author";
  return <div className="rounded-2xl border border-dashed border-border/60 px-5 py-12 text-center"><BookOpen className="mx-auto h-7 w-7 text-primary/60" /><p className="mt-3 font-display text-lg">{isAuthor ? "Tus autoras y autores aparecerán aquí" : "Tus sagas aparecerán aquí"}</p><p className="mt-1 text-sm text-muted-foreground">{isAuthor ? "Termina un libro para empezar a construir tu mapa lector." : "Añade y termina libros que formen parte de una saga."}</p></div>;
}

export default function AuthorsSagas() {
  const { books } = useBooksContext();
  const [search, setSearch] = useState("");
  const finishedBooks = useMemo(() => books.filter((book) => book.status === "finished"), [books]);
  const authors = useMemo<CollectionEntry[]>(() => {
    const map = new Map<string, CollectionEntry>();
    finishedBooks.forEach((book) => { const name = book.author.trim(); if (!name) return; const entry = map.get(name) || { name, total: 0, titles: [] }; entry.total += 1; entry.titles.push(book.title); map.set(name, entry); });
    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "es"));
  }, [finishedBooks]);
  const sagas = useMemo<CollectionEntry[]>(() => {
    const map = new Map<string, CollectionEntry>();
    finishedBooks.forEach((book) => { const name = book.saga?.trim(); if (!book.hasSaga || !name) return; const entry = map.get(name) || { name, total: 0, titles: [] }; entry.total += 1; entry.titles.push(book.title); map.set(name, entry); });
    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "es"));
  }, [finishedBooks]);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matches = (entry: CollectionEntry) => !normalizedSearch || `${entry.name} ${entry.titles.join(" ")}`.toLocaleLowerCase().includes(normalizedSearch);
  const visibleAuthors = authors.filter(matches);
  const visibleSagas = sagas.filter(matches);

  return <div className="space-y-8 pb-8">
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card px-5 py-7 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.18)]"><div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" /><div className="relative"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Tu mapa literario</p><div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Autores y Sagas</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Las voces que vuelves a buscar y los universos en los que te gusta quedarte.</p></div><div className="grid grid-cols-2 gap-5 rounded-2xl border border-border/45 bg-background/40 px-5 py-3 text-right"><div><p className="font-display text-2xl font-semibold">{authors.length}</p><p className="text-xs text-muted-foreground">autores</p></div><div><p className="font-display text-2xl font-semibold text-primary">{sagas.length}</p><p className="text-xs text-muted-foreground">sagas</p></div></div></div><label className="mt-7 flex h-13 max-w-2xl items-center gap-3 rounded-2xl border border-border/50 bg-background/60 px-4 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20"><Search className="h-5 w-5 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Busca una autora, un autor, una saga o un título" aria-label="Buscar en autores y sagas" />{search && <button type="button" onClick={() => setSearch("")} className="text-xs font-medium text-primary hover:underline">Limpiar</button>}</label></div></section>
    <div className="grid gap-8 xl:grid-cols-2">
      <section><div className="mb-4 flex items-end justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><UsersRound className="h-4 w-4" /> Autores</p><h3 className="mt-1 font-display text-2xl font-semibold">Las voces que te acompañan</h3></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{visibleAuthors.length}</span></div><div className="space-y-3">{visibleAuthors.length ? visibleAuthors.map((entry) => <CollectionCard key={entry.name} entry={entry} kind="author" />) : <EmptyState kind="author" />}</div></section>
      <section><div className="mb-4 flex items-end justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100"><LibraryBig className="h-4 w-4" /> Sagas</p><h3 className="mt-1 font-display text-2xl font-semibold">Universos en orden</h3></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{visibleSagas.length}</span></div><div className="space-y-3">{visibleSagas.length ? visibleSagas.map((entry) => <CollectionCard key={entry.name} entry={entry} kind="saga" />) : <EmptyState kind="saga" />}</div></section>
    </div>
  </div>;
}
