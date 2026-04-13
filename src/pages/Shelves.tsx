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

const SHELF_ORDER_KEY = "book-tracker-shelf-order";

function getBooksPerShelf() {
  const w = window.innerWidth;
  if (w < 480) return 4;
  if (w < 640) return 6;
  if (w < 768) return 8;
  if (w < 1024) return 11;
  return 14;
}

function loadOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(SHELF_ORDER_KEY) || "[]"); } catch { return []; }
}
function saveOrder(order: string[]) {
  localStorage.setItem(SHELF_ORDER_KEY, JSON.stringify(order));
}

function getSpineColor(title: string): string {
  const colors = [
    { bg: "#7c3aed" }, { bg: "#0f766e" }, { bg: "#b91c1c" }, { bg: "#b45309" },
    { bg: "#1d4ed8" }, { bg: "#be185d" }, { bg: "#15803d" }, { bg: "#7e22ce" },
    { bg: "#c2410c" }, { bg: "#0e7490" },
  ];
  const idx = (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % colors.length;
  return colors[idx].bg;
}

function getSpineTextColor(title: string): string {
  const colors = ["#ede9fe","#ccfbf1","#fee2e2","#fef3c7","#dbeafe","#fce7f3","#dcfce7","#f3e8ff","#ffedd5","#cffafe"];
  const idx = (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % colors.length;
  return colors[idx];
}

function SortableBook({ book }: { book: Book }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: book.id });

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
          style={style}
          style={{ width: "78px", height: "118px" }}
          className={`relative group shrink-0 cursor-grab active:cursor-grabbing touch-none select-none ${
            isDragging ? "scale-110 rotate-2" : "transition-all duration-200 hover:-translate-y-3 hover:z-20"
          }`}
          {...attributes}
          {...listeners}
        >
          {book.coverUrl && !coverFailed ? (
            <div className="relative">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-[46px] sm:w-[58px] md:w-[70px] h-[69px] sm:h-[87px] md:h-[105px] object-cover rounded-[2px]"
                draggable={false}
                style={{ boxShadow: "3px 3px 8px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.2), inset 1px 0 1px rgba(255,255,255,0.15)" }}
                onError={() => setCoverFailed(true)}
              />
              
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-[2px]" />
            </div>
          ) : (
            <div
              className="w-[46px] sm:w-[58px] md:w-[70px] h-[69px] sm:h-[87px] md:h-[105px] rounded-[2px] flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: spineColor,
                boxShadow: "3px 3px 8px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.2), inset 1px 0 1px rgba(255,255,255,0.2)",
              }}
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 9px)" }} />
              
              
              
              <span
                className="text-[6px] sm:text-[7px] font-bold tracking-widest whitespace-nowrap overflow-hidden max-w-[85%] z-10"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed", color: spineTextColor, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
              >
                {book.title.length > 14 ? book.title.slice(0, 14) + "…" : book.title}
              </span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[180px] bg-popover/95 backdrop-blur-sm">
        <p className="text-xs font-semibold">{book.title}</p>
        <p className="text-[10px] text-muted-foreground">{book.author}</p>
        {book.rating > 0 && <p className="text-amber-400 text-[10px] mt-0.5">{"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}</p>}
        {book.hasSaga && book.saga && <p className="text-[9px] text-muted-foreground/60 mt-0.5 italic">{book.saga}{book.sagaOrder ? ` #${book.sagaOrder}` : ""}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export default function Shelves() {
  const { books, updateBook } = useBooksContext();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [booksPerShelf, setBooksPerShelf] = useState(getBooksPerShelf);
  const [groupBySaga, setGroupBySaga] = useState(false);

  useEffect(() => {
    const handleResize = () => setBooksPerShelf(getBooksPerShelf());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const finishedBooks = useMemo(() => books.filter((b) => b.status === "finished"), [books]);

  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadOrder();
    const finishedIds = new Set(finishedBooks.map((b) => b.id));
    const existing = saved.filter((id) => finishedIds.has(id));
    const newIds = finishedBooks.filter((b) => !existing.includes(b.id)).map((b) => b.id);
    const merged = [...existing, ...newIds];
    setOrderedIds(merged);
    if (newIds.length > 0) saveOrder(merged);
  }, [finishedBooks]);

  const orderedBooks = useMemo(() => {
    const bookMap = new Map(finishedBooks.map((b) => [b.id, b]));
    const ordered = orderedIds.map((id) => bookMap.get(id)).filter(Boolean) as Book[];
    if (!groupBySaga) return ordered;
    // Group by saga and sort each group by sagaOrder ascending (1, 2, 3...)
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
    sagaGroups.forEach((books, saga) => {
      sagaGroups.set(saga, [...books].sort((a, b) => {
        const aOrder = parseFloat(a.sagaOrder || "9999") || 9999;
        const bOrder = parseFloat(b.sagaOrder || "9999") || 9999;
        return aOrder - bOrder;
      }));
    });
    return [...Array.from(sagaGroups.values()).flat(), ...individuals];
  }, [orderedIds, finishedBooks, groupBySaga]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">📖 Mi Estantería</h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">{finishedBooks.length}</span> libro{finishedBooks.length !== 1 ? "s" : ""} leído{finishedBooks.length !== 1 ? "s" : ""}
            <span className="mx-2 opacity-30">·</span>
            <span className="opacity-60 hidden sm:inline">arrastra para reorganizar</span>
            <span className="opacity-60 sm:hidden">mantén pulsado para mover</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {finishedBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-2xl border border-border/30 bg-card/30">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center">
              <span className="text-4xl">📖</span>
            </div>
            <div className="absolute -top-1 -right-1 text-xl">✨</div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-semibold font-display text-foreground">Tu estantería te espera</p>
            <p className="text-sm text-muted-foreground font-display max-w-xs mx-auto">
              "No hay mejor amigo que un libro, ni mejor compañero que una buena historia."
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60 font-display">
            Marca libros como <span className="text-emerald-500 font-medium">Terminado</span> y aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                padding: "0",
                border: "none",
              }}
            >
              
              <div className="absolute top-3 bottom-0 left-0 w-3 sm:w-4" style={{ background: "linear-gradient(to right, #78350f, #92400e 50%, #6b2d0c)" }} />
              <div className="absolute top-3 bottom-0 right-0 w-3 sm:w-4" style={{ background: "linear-gradient(to left, #78350f, #92400e 50%, #6b2d0c)" }} />
              <div className="relative mt-3 rounded-sm overflow-hidden" style={{ background: "linear-gradient(to bottom, #0f0704 0%, #130a05 50%, #0f0704 100%)" }}>
                <div className="space-y-0 py-1 px-1 sm:px-1">
                  {shelves.map((row, rowIndex) => (
                    <ShelfRow key={rowIndex} row={row} rowIndex={rowIndex} />
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
          onOpenChange={(open) => { if (!open) setEditingBook(null); }}
          onSave={(id, data) => { updateBook(id, data); setEditingBook(null); }}
        />
      )}
    </div>
  );
}

function ShelfRow({ row, rowIndex }: { row: Book[]; rowIndex: number }) {
  return (
    <div className="relative">
      <div
        className="flex items-end gap-[2px] sm:gap-[3px] px-3 sm:px-5 pt-4 pb-0 min-h-[80px] sm:min-h-[100px] relative overflow-x-auto"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.0), rgba(0,0,0,0.1))", scrollbarWidth: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {row.map((book) => (
          <SortableBook key={book.id} book={book} />
        ))}
      </div>
      <div
        className="h-[16px] sm:h-[20px]"
        style={{
          background: "linear-gradient(to bottom, #a16207 0%, #92400e 30%, #78350f 60%, #5c2408 100%)",
          boxShadow: "0 5px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,180,80,0.25)",
        }}
      />
      <div className="h-[4px] sm:h-[6px]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.0) 100%)" }} />
    </div>
  );
}
