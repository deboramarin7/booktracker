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
const BOOKS_PER_SHELF = 17;

function loadOrder(): string[] {
  try { return JSON.parse(localStorage.getItem(SHELF_ORDER_KEY) || "[]"); } catch { return []; }
}
function saveOrder(order: string[]) {
  localStorage.setItem(SHELF_ORDER_KEY, JSON.stringify(order));
}

function SortableBook({ book, onClick }: { book: Book; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={`relative group shrink-0 cursor-grab active:cursor-grabbing touch-none ${isDragging ? "scale-105" : "transition-transform hover:-translate-y-2 hover:z-10"}`}
          {...attributes}
          {...listeners}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-[52px] sm:w-[62px] h-[78px] sm:h-[93px] object-cover rounded-sm shadow-md border border-black/10"
              draggable={false}
              style={{ boxShadow: "2px 2px 6px rgba(0,0,0,0.3), inset -1px 0 2px rgba(255,255,255,0.1)" }}
            />
          ) : (
            <div
              className="w-[52px] sm:w-[62px] h-[78px] sm:h-[93px] rounded-sm shadow-md flex items-center justify-center border border-black/10 bg-muted"
              style={{ boxShadow: "2px 2px 6px rgba(0,0,0,0.3)" }}
            >
              <span
                className="text-[7px] font-bold text-muted-foreground whitespace-nowrap overflow-hidden max-w-[90%]"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                {book.title.length > 18 ? book.title.slice(0, 18) + "…" : book.title}
              </span>
            </div>
          )}
          <div className="absolute top-0 left-0 w-full h-full bg-black/0 group-hover:bg-black/10 rounded-sm transition-colors" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <p className="text-xs font-medium">{book.title}</p>
        <p className="text-[10px] text-muted-foreground">{book.author}</p>
        {book.rating > 0 && <p className="text-amber-500 text-[10px]">{"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}</p>}
        <p className="text-[9px] text-muted-foreground/70 mt-1">Doble clic para editar</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Shelves() {
  const { books, updateBook } = useBooksContext();
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const finishedBooks = useMemo(() =>
    books.filter((b) => b.status === "finished"),
    [books]
  );

  const [orderedIds, setOrderedIds] = useState<string[]>([]);

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
    for (let i = 0; i < orderedBooks.length; i += BOOKS_PER_SHELF) {
      rows.push(orderedBooks.slice(i, i + BOOKS_PER_SHELF));
    }
    if (rows.length === 0) rows.push([]);
    return rows;
  }, [orderedBooks]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display">📚 Mi Estantería</h2>
        <p className="text-muted-foreground mt-1">
          {finishedBooks.length} libro{finishedBooks.length !== 1 ? "s" : ""} leído{finishedBooks.length !== 1 ? "s" : ""} — arrastra para reorganizar · doble clic para editar
        </p>
      </div>

      {finishedBooks.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <p className="text-lg font-semibold mb-2">Tu estantería está vacía</p>
          <p className="text-muted-foreground">Los libros terminados aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div className="space-y-0 rounded-lg overflow-hidden p-4 bg-gradient-to-b from-amber-900/20 to-amber-950/30 dark:from-amber-900/15 dark:to-amber-950/25 border border-amber-800/20">
              {shelves.map((row, rowIndex) => (
                <div key={rowIndex} className="relative">
                  <div className="flex flex-wrap items-end gap-[4px] px-3 pt-4 pb-1 min-h-[90px]">
                    {row.map((book) => (
                      <SortableBook key={book.id} book={book} onClick={() => setEditingBook(book)} />
                    ))}
                  </div>
                  <div className="h-3.5 bg-gradient-to-b from-amber-700 to-amber-900 dark:from-amber-800 dark:to-amber-950 rounded-sm shadow-lg" 
                    style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)" }}
                  />
                  <div className="h-1.5 bg-amber-950/40 dark:bg-amber-950/60 rounded-b-sm" />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingBook && (
        <EditBookDialog
          book={editingBook}
          open={!!editingBook}
          onOpenChange={(open) => { if (!open) setEditingBook(null); }}
          onSave={(id, data) => {
            updateBook(id, data);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
}
