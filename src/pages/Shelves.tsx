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

// Responsive books per shelf
function getBooksPerShelf() {
  const w = window.innerWidth;
  if (w < 480) return 7;
  if (w < 640) return 9;
  if (w < 768) return 11;
  if (w < 1024) return 14;
  return 17;
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

function SortableBook({ book, onClick }: { book: Book; onClick: () => void }) {
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
          className={`relative group shrink-0 cursor-grab active:cursor-grabbing touch-none select-none ${
            isDragging ? "scale-110 rotate-2" : "transition-all duration-200 hover:-translate-y-3 hover:z-20"
          }`}
          {...attributes}
          {...listeners}
          onDoubleClick={(e) => { e.stopPropagation(); onClick(); }}
          onTouchEnd={(e) => {
            // Long press handled via touchstart/touchend timing
          }}
        >
          {book.coverUrl && !coverFailed ? (
            <div className="relative">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-[36px] sm:w-[45px] md:w-[55px] h-[54px] sm:h-[68px] md:h-[82px] object-cover rounded-[2px]"
                draggable={false}
                style={{ boxShadow: "3px 3px 8px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.2), inset 1px 0 1px rgba(255,255,255,0.15)" }}
                onError={() => setCoverFailed(true)}
              />
              <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-white/20 to-transparent rounded-l-[2px]" />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-[2px]" />
            </div>
          ) : (
            <div
              className="w-[36px] sm:w-[45px] md:w-[55px] h-[54px] sm:h-[68px] md:h-[82px] rounded-[2px] flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: spineColor,
                boxShadow: "3px 3px 8px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.2), inset 1px 0 1px rgba(255,255,255,0.2)",
              }}
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 9px)" }} />
              <div className="absolute top-[4px] left-[3px] right-[3px] h-[1px] opacity-40" style={{ backgroundColor: spineTextColor }} />
              <div className="absolute bottom-[4px] left-[3px] right-[3px] h-[1px] opacity-40" style={{ backgroundColor: spineTextColor }} />
              <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-white/25 to-transparent" />
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
        <p className="text-[9px] text-muted-foreground/60 mt-1 italic">Toca para editar</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Shelves() {
  const { books, updateBook } = useBooksContext();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [booksPerShelf, setBooksPerShelf] = useState(getBooksPerShelf);

  // Update booksPerShelf on resize
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
    return orderedIds.map((id) => bookMap.get(id)).filter(Boolean) as Book[];
  }, [orderedIds, finishedBooks]);

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
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Mi Estantería</h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">{finishedBooks.length}</span> libro{finishedBooks.length !== 1 ? "s" : ""} leído{finishedBooks.length !== 1 ? "s" : ""}
            <span className="mx-2 opacity-30">·</span>
            <span className="opacity-60 hidden sm:inline">arrastra para reorganizar · doble clic para editar</span>
            <span className="opacity-60 sm:hidden">mantén pulsado para mover · toca para editar</span>
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground/50 hidden sm:block">
          <p>{shelves.length} estante{shelves.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {finishedBooks.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-border/40 bg-card/50">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-lg font-semibold mb-2">Tu estantería está vacía</p>
          <p className="text-muted-foreground text-sm">Los libros terminados aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1c0f05 0%, #2d1a0e 30%, #1a0d04 70%, #150a03 100%)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)",
                padding: "12px 12px 16px",
                border: "1px solid rgba(146, 64, 14, 0.3)",
              }}
            >
              {/* Top rail */}
              <div className="absolute top-0 left-0 right-0 h-3 rounded-t-xl" style={{ background: "linear-gradient(to bottom, #92400e, #78350f)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)" }} />
              {/* Side rails */}
              <div className="absolute top-3 bottom-0 left-0 w-3 sm:w-4" style={{ background: "linear-gradient(to right, #78350f, #92400e 50%, #6b2d0c)" }} />
              <div className="absolute top-3 bottom-0 right-0 w-3 sm:w-4" style={{ background: "linear-gradient(to left, #78350f, #92400e 50%, #6b2d0c)" }} />

              {/* Book area */}
              <div className="relative mt-3 rounded-sm overflow-hidden" style={{ background: "linear-gradient(to bottom, #0f0704 0%, #130a05 50%, #0f0704 100%)" }}>
                <div className="space-y-0 py-1 px-1 sm:px-1">
                  {shelves.map((row, rowIndex) => (
                    <ShelfRow
                      key={rowIndex}
                      row={row}
                      rowIndex={rowIndex}
                      onBookClick={(book) => setEditingBook(book)}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom rail */}
              <div className="absolute bottom-0 left-0 right-0 h-4 rounded-b-xl" style={{ background: "linear-gradient(to top, #6b2d0c, #92400e)", boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.1)" }} />
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

function ShelfRow({ row, rowIndex, onBookClick }: { row: Book[]; rowIndex: number; onBookClick: (book: Book) => void }) {
  return (
    <div className="relative">
      {/* Books row — horizontal scroll on mobile */}
      <div
        className="flex items-end gap-[2px] sm:gap-[3px] px-3 sm:px-5 pt-4 pb-0 min-h-[70px] sm:min-h-[90px] relative overflow-x-auto"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.0), rgba(0,0,0,0.1))", scrollbarWidth: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {row.map((book) => (
          <SortableBook key={book.id} book={book} onClick={() => onBookClick(book)} />
        ))}
      </div>

      {/* Shelf plank */}
      <div
        className="h-[10px] sm:h-[14px]"
        style={{
          background: "linear-gradient(to bottom, #a16207 0%, #92400e 30%, #78350f 60%, #5c2408 100%)",
          boxShadow: "0 5px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,180,80,0.25)",
        }}
      />
      <div className="h-[4px] sm:h-[6px]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.0) 100%)" }} />
    </div>
  );
}
