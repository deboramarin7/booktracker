import { useState, useEffect, useMemo } from "react";
import { useBooksContext } from "@/components/Layout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EditBookDialog } from "@/components/EditBookDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Book } from "@/hooks/useBooks";
import { LampDesk, Leaf, Palette, Sparkles } from "lucide-react";

const SHELF_ORDER_KEY = "book-tracker-shelf-order";
const SHELF_STYLE_KEY = "book-tracker-shelf-style";
type ShelfTheme = "midnight" | "walnut" | "forest";
type ShelfSettings = { theme: ShelfTheme; plants: boolean; lights: boolean };

const SHELF_THEMES: Record<ShelfTheme, { label: string; panel: string; plank: string; accent: string }> = {
  midnight: { label: "Noche", panel: "linear-gradient(180deg, #111827 0%, #080b12 100%)", plank: "linear-gradient(to bottom, #596271 0%, #303846 45%, #151a23 100%)", accent: "#5eead4" },
  walnut: { label: "Nogal", panel: "linear-gradient(180deg, #33251f 0%, #19110f 100%)", plank: "linear-gradient(to bottom, #9a6a47 0%, #67442f 45%, #2b1914 100%)", accent: "#fbbf77" },
  forest: { label: "Bosque", panel: "linear-gradient(180deg, #172820 0%, #0b1410 100%)", plank: "linear-gradient(to bottom, #55745c 0%, #35513d 45%, #17261c 100%)", accent: "#a7f3b2" },
};

function getBooksPerShelf() {
  const w = window.innerWidth;
  if (w < 480) return 4;
  if (w < 640) return 6;
  if (w < 768) return 8;
  if (w < 1024) return 11;
  return 14;
}

function loadOrder(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SHELF_ORDER_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveOrder(order: string[]) {
  localStorage.setItem(SHELF_ORDER_KEY, JSON.stringify(order));
}

function loadShelfSettings(): ShelfSettings {
  try {
    return { theme: "midnight", plants: true, lights: true, ...JSON.parse(localStorage.getItem(SHELF_STYLE_KEY) || "{}") };
  } catch {
    return { theme: "midnight", plants: true, lights: true };
  }
}

function getSpineColor(title: string): string {
  const colors = [
    { bg: "#7c3aed" },
    { bg: "#0f766e" },
    { bg: "#b91c1c" },
    { bg: "#b45309" },
    { bg: "#1d4ed8" },
    { bg: "#be185d" },
    { bg: "#15803d" },
    { bg: "#7e22ce" },
    { bg: "#c2410c" },
    { bg: "#0e7490" },
  ];
  const idx =
    (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % colors.length;
  return colors[idx].bg;
}

function getSpineTextColor(title: string): string {
  const colors = [
    "#ede9fe",
    "#ccfbf1",
    "#fee2e2",
    "#fef3c7",
    "#dbeafe",
    "#fce7f3",
    "#dcfce7",
    "#f3e8ff",
    "#ffedd5",
    "#cffafe",
  ];
  const idx =
    (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % colors.length;
  return colors[idx];
}

function SortableBook({ book }: { book: Book }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const spineColor = getSpineColor(book.title);
  const spineTextColor = getSpineTextColor(book.title);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={{ ...style, width: "75px", height: "112px" }}
          className={`relative group shrink-0 cursor-grab active:cursor-grabbing touch-none select-none ${
            isDragging
              ? "scale-110 rotate-2"
              : "transition-all duration-200 hover:-translate-y-3 hover:z-20"
          }`}
          {...attributes}
          {...listeners}
        >
          {book.coverUrl && !coverFailed ? (
            <div className="relative">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-[70px] sm:w-[70px] md:w-[75px] h-[105px] sm:h-[105px] md:h-[112px] object-cover rounded-[4px] transition-transform duration-200 group-hover:scale-[1.03]"
                draggable={false}
                style={{
                  boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
                }}
                onError={() => setCoverFailed(true)}
              />
              <div className="absolute inset-0 rounded-[4px] bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
            </div>
          ) : (
            <div
              className="w-[70px] sm:w-[70px] md:w-[75px] h-[105px] sm:h-[105px] md:h-[112px] rounded-[4px] flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: spineColor,
                boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 9px)",
                }}
              />
              <span
                className="text-[6px] sm:text-[7px] font-bold tracking-widest whitespace-nowrap overflow-hidden max-w-[85%] z-10"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  color: spineTextColor,
                  textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                }}
              >
                {book.title.length > 14 ? `${book.title.slice(0, 14)}…` : book.title}
              </span>
            </div>
          )}
        </div>
      </TooltipTrigger>

      <TooltipContent side="top" className="max-w-[180px] bg-popover/95 backdrop-blur-sm">
        <p className="text-xs font-semibold">{book.title}</p>
        <p className="text-[10px] text-muted-foreground">{book.author}</p>
        {book.rating > 0 && (
          <p className="text-amber-400 text-[10px] mt-0.5">
            {"★".repeat(book.rating)}
            {"☆".repeat(5 - book.rating)}
          </p>
        )}
        {book.hasSaga && book.saga && (
          <p className="text-[9px] text-muted-foreground/60 mt-0.5 italic">
            {book.saga}
            {book.sagaOrder ? ` #${book.sagaOrder}` : ""}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default function Shelves() {
  const { books, updateBook } = useBooksContext();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [booksPerShelf, setBooksPerShelf] = useState(getBooksPerShelf);
  const [groupBySaga, setGroupBySaga] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [shelfSettings, setShelfSettings] = useState<ShelfSettings>(loadShelfSettings);
  const selectedTheme = SHELF_THEMES[shelfSettings.theme];

  useEffect(() => {
    const handleResize = () => setBooksPerShelf(getBooksPerShelf());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem(SHELF_STYLE_KEY, JSON.stringify(shelfSettings));
  }, [shelfSettings]);

  const finishedBooks = useMemo(
    () => books.filter((b) => b.status === "finished"),
    [books]
  );

  useEffect(() => {
    const saved = loadOrder();
    const finishedIds = new Set(finishedBooks.map((b) => b.id));
    const existing = saved.filter((id) => finishedIds.has(id));
    const newIds = finishedBooks
      .filter((b) => !existing.includes(b.id))
      .map((b) => b.id);

    const merged = [...existing, ...newIds];
    setOrderedIds(merged);

    if (newIds.length > 0) saveOrder(merged);
  }, [finishedBooks]);

  const orderedBooks = useMemo(() => {
    const bookMap = new Map(finishedBooks.map((b) => [b.id, b]));
    const ordered = orderedIds
      .map((id) => bookMap.get(id))
      .filter(Boolean) as Book[];

    if (!groupBySaga) return ordered;

    const sagaGroups = new Map<string, Book[]>();
    const individuals: Book[] = [];

    ordered.forEach((book) => {
      if (book.hasSaga && book.saga) {
        if (!sagaGroups.has(book.saga)) sagaGroups.set(book.saga, []);
        sagaGroups.get(book.saga)!.push(book);
      } else {
        individuals.push(book);
      }
    });

    sagaGroups.forEach((booksInSaga, saga) => {
      sagaGroups.set(
        saga,
        [...booksInSaga].sort((a, b) => {
          const aOrder = parseFloat(a.sagaOrder || "9999") || 9999;
          const bOrder = parseFloat(b.sagaOrder || "9999") || 9999;
          return aOrder - bOrder;
        })
      );
    });

    return [...Array.from(sagaGroups.values()).flat(), ...individuals];
  }, [orderedIds, finishedBooks, groupBySaga]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedIds((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        saveOrder(newOrder);
        return newOrder;
      });
    }
  };

  const shelves = useMemo(() => {
    const rows: Book[][] = [];
    for (let i = 0; i < orderedBooks.length; i += booksPerShelf) {
      rows.push(orderedBooks.slice(i, i + booksPerShelf));
    }
    if (rows.length === 0) rows.push([]);
    return rows;
  }, [orderedBooks, booksPerShelf]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            📖 Mi Estantería
          </h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">{finishedBooks.length}</span>{" "}
            libro{finishedBooks.length !== 1 ? "s" : ""} leído
            {finishedBooks.length !== 1 ? "s" : ""}
            <span className="opacity-60"> (histórico, todos los años)</span>
            <span className="mx-2 opacity-30">·</span>
            <span className="opacity-60 hidden sm:inline">arrastra para reorganizar</span>
            <span className="opacity-60 sm:hidden">mantén pulsado para mover</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCustomizer((visible) => !visible)}
            aria-expanded={showCustomizer}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${showCustomizer ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border/40 hover:text-foreground hover:border-border"}`}
          >
            <Palette className="h-3.5 w-3.5" /> Personalizar
          </button>
          <button
            onClick={() => setGroupBySaga(!groupBySaga)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              groupBySaga
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground border-border/40 hover:text-foreground hover:border-border"
            }`}
          >
            {groupBySaga ? "📚 Agrupado por saga" : "📚 Agrupar por saga"}
          </button>

          <span className="text-right text-xs text-muted-foreground/50 hidden sm:block">
            {shelves.length} estante{shelves.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {showCustomizer && (
        <section className="rounded-2xl border border-border/45 bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Hazla tuya</p><p className="mt-1 text-sm text-muted-foreground">Elige un ambiente y añade los detalles que quieres ver en tu rincón lector.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(SHELF_THEMES) as ShelfTheme[]).map((theme) => <button key={theme} type="button" onClick={() => setShelfSettings((current) => ({ ...current, theme }))} aria-pressed={shelfSettings.theme === theme} className={`h-10 rounded-xl border px-3 text-xs font-medium transition-colors ${shelfSettings.theme === theme ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"}`}>{SHELF_THEMES[theme].label}</button>)}
              <button type="button" onClick={() => setShelfSettings((current) => ({ ...current, plants: !current.plants }))} aria-pressed={shelfSettings.plants} className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${shelfSettings.plants ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground"}`}><Leaf className="h-3.5 w-3.5" /> Plantas</button>
              <button type="button" onClick={() => setShelfSettings((current) => ({ ...current, lights: !current.lights }))} aria-pressed={shelfSettings.lights} className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${shelfSettings.lights ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-border/50 text-muted-foreground"}`}><LampDesk className="h-3.5 w-3.5" /> Luces</button>
            </div>
          </div>
        </section>
      )}

      {finishedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-2xl border border-border/30 bg-card/30">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center">
              <span className="text-4xl">📖</span>
            </div>
            <div className="absolute -top-1 -right-1 text-xl">✨</div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xl font-semibold font-display text-foreground">
              Tu estantería te espera
            </p>
            <p className="text-sm text-muted-foreground font-display max-w-xs mx-auto">
              "No hay mejor amigo que un libro, ni mejor compañero que una buena historia."
            </p>
          </div>

          <p className="text-xs text-muted-foreground/60 font-display">
            Marca libros como <span className="text-emerald-500 font-medium">Terminado</span> y
            aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div className="relative">
              <div
                className="absolute top-3 bottom-0 left-0 w-3 sm:w-4"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <div
                className="absolute top-3 bottom-0 right-0 w-3 sm:w-4"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />

              <div
                className="relative mt-3 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm"
                style={{ background: selectedTheme.panel }}
              >
                <div className="space-y-0 py-1 px-1 sm:px-1">
                  {shelves.map((row, rowIndex) => (
                    <ShelfRow key={rowIndex} row={row} plank={selectedTheme.plank} lights={shelfSettings.lights} plants={shelfSettings.plants} lightColor={selectedTheme.accent} />
                  ))}
                </div>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingBook && (
        <EditBookDialog
          book={editingBook}
          open={!!editingBook}
          onOpenChange={(open) => {
            if (!open) setEditingBook(null);
          }}
          onSave={(id, data) => {
            updateBook(id, data);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
}

function ShelfRow({ row, plank, lights, plants, lightColor }: { row: Book[]; plank: string; lights: boolean; plants: boolean; lightColor: string }) {
  const plantPosition = Math.max(1, Math.floor(row.length / 2));
  return (
    <div className="relative">
      {lights && (
        <div className="pointer-events-none absolute inset-x-3 top-0 z-20 h-11 sm:inset-x-5" aria-hidden="true">
          <svg className="absolute inset-x-0 top-0 h-8 w-full" viewBox="0 0 100 28" preserveAspectRatio="none"><path d="M0,3 C10,24 18,8 28,16 S46,24 57,10 S77,25 100,6" fill="none" stroke="rgba(14,18,22,0.9)" strokeWidth="1.8" /></svg>
          <div className="absolute inset-x-[4%] top-[7px] flex items-start justify-between">
            {Array.from({ length: 12 }).map((_, index) => <span key={index} className="flex flex-col items-center" style={{ transform: `translateY(${[4, 11, 7, 14, 8, 12][index % 6]}px)` }}><span className="h-2 w-px bg-black/80" /><span className="h-2.5 w-2.5 rounded-full border border-amber-50/70 shadow-[0_0_10px_rgba(255,218,142,0.95),0_0_20px_rgba(255,194,92,0.5)]" style={{ backgroundColor: lightColor }} /></span>)}
          </div>
        </div>
      )}
      <div
        className="flex items-end gap-[3px] sm:gap-[4px] px-3 sm:px-5 pt-9 pb-0 min-h-[145px] sm:min-h-[155px] flex-wrap relative overflow-x-auto"
        style={{ background: "transparent", scrollbarWidth: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {row.map((book, index) => <div key={book.id} className="flex items-end gap-[3px] sm:gap-[4px]"><SortableBook book={book} />{plants && index === plantPosition && <div className="mb-1 flex h-[72px] w-[42px] shrink-0 flex-col items-center justify-end"><div className="flex -space-x-3"><Leaf className="h-8 w-8 -rotate-12 text-emerald-300/90 drop-shadow-md" fill="currentColor" /><Leaf className="h-9 w-9 rotate-12 text-emerald-400/80 drop-shadow-md" fill="currentColor" /></div><div className="h-4 w-7 rounded-b-md rounded-t-sm border border-amber-100/25 bg-gradient-to-b from-orange-200/70 to-amber-900/80 shadow-md" /></div>}</div>)}
      </div>

      <div
        className="h-[16px] sm:h-[20px]"
        style={{
          background: plank,
          boxShadow:
            "0 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      <div
        className="h-[4px] sm:h-[6px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.0) 100%)",
        }}
      />
    </div>
  );
}
