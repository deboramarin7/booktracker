import { createContext, useContext, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { BookOpen, Menu, Moon, Sun, Sparkles } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import type { Book } from "@/hooks/useBooks";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { GlobalSearch } from "@/components/GlobalSearch";
import { EditBookDialog } from "@/components/EditBookDialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface BooksContextType {
  books: Book[];
  loading: boolean;
  addBook: (data: Omit<Book, "id" | "addedAt">) => void;
  addBooksInBatch: (data: Omit<Book, "id" | "addedAt">[]) => Promise<Book[]>;
  updateBook: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void;
  deleteBook: (id: string) => void;
  addWishItem: (data: Omit<WishItem, "id">) => void;
}

const BooksContext = createContext<BooksContextType | null>(null);

export function useBooksContext() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error("useBooksContext must be used inside Layout");
  return ctx;
}

export default function Layout() {
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
  const { addItem: addWishItem } = useWishlist();
  const { dark, setDark } = useTheme();
  const [searchEditBook, setSearchEditBook] = useState<Book | null>(null);

  const menuBg = dark ? "hsl(220, 16%, 12%)" : "hsl(220, 14%, 98%)";
  const menuText = dark ? "hsl(220, 10%, 92%)" : "hsl(220, 15%, 12%)";
  const menuHoverBg = dark ? "hsl(220, 12%, 20%)" : "hsl(220, 10%, 91%)";

  const navLinks = [
    { to: "/biblioteca", label: "📚 Biblioteca" },
    { to: "/autores-sagas", label: "✍️ Autores" },
    { to: "/wishlist", label: "💜 Wish List" },
    { to: "/estanterias", label: "📖 Estantería" },
    { to: "/reading-habits", label: "📅 Hábitos" },
    { to: "/logros", label: "🎯 Logros" },
    { to: "/dashboard", label: "📊 Dashboard" },
    { to: "/wrapped", label: "Wrapped ✨" },
    { to: "/ayuda", label: "Ayuda" },
  ];

  return (
    <BooksContext.Provider value={{ books, loading, addBook, addBooksInBatch, updateBook, deleteBook, addWishItem }}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: "linear-gradient(180deg, hsl(var(--card)/0.97) 0%, hsl(var(--card)/0.92) 100%)", borderBottom: "1px solid hsl(var(--border)/0.5)", boxShadow: "0 1px 40px rgba(0,0,0,0.15)" }}>
          <div className="container flex items-center justify-between py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--primary)/0.05))", border: "1px solid hsl(var(--primary)/0.3)" }}>
                <BookOpen className="h-5 w-5 text-primary" />
                <Sparkles className="h-2.5 w-2.5 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight font-display text-foreground leading-none">Book Tracker</h1>
                <p className="text-[10px] text-muted-foreground font-display tracking-widest uppercase leading-none mt-0.5">Tu diario lector</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-1 items-center">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-body transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground warm-shadow"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark(!dark)}
                className="ml-1 hover:bg-warm-gold/10 hover:text-warm-gold transition-colors"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </nav>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-1">
              <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark(!dark)}
                className="hover:bg-warm-gold/10"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-secondary/80">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-72 pt-10 border-l border-border"
                  style={{ backgroundColor: menuBg, color: menuText }}
                >
                  <div className="flex items-center gap-2 mb-8 px-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-display text-lg font-semibold" style={{ color: menuText }}>Menú</span>
                  </div>
                  <nav className="flex flex-col gap-1 px-2">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.to}>
                        <NavLink
                          to={link.to}
                          end={link.end}
                          className="block px-4 py-3 rounded-lg text-base font-body font-medium transition-all"
                          style={({ isActive }) => ({
                            backgroundColor: isActive ? "hsl(var(--primary))" : "transparent",
                            color: isActive ? "hsl(var(--primary-foreground))" : menuText,
                          })}
                        >
                          {link.label}
                        </NavLink>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="container py-4 md:py-8 space-y-0 page-transition">
          <Outlet />
        </main>

        {searchEditBook && (
          <EditBookDialog
            book={searchEditBook}
            open={!!searchEditBook}
            onOpenChange={(open) => { if (!open) setSearchEditBook(null); }}
            onSave={(id, data) => {
              updateBook(id, data);
              setSearchEditBook(null);
            }}
          />
        )}
      </div>
    </BooksContext.Provider>
  );
}
