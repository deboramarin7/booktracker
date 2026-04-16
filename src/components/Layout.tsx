import { createContext, useContext, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { BookOpen, Menu, Moon, Sun, Sparkles, Palette, X,
  Library, Users, Heart, BookMarked, CalendarDays, Trophy, BarChart3, Gift, HelpCircle
} from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useBooks } from "@/hooks/useBooks";
import type { Book } from "@/hooks/useBooks";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

// ─── TU CONTEXT (sin cambios) ───
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

// ─── LINKS CON ICONOS ───
const navLinks = [
  { to: "/", label: "Mi Biblioteca", icon: Library, end: true },
  { to: "/autores-sagas", label: "Autores y Sagas", icon: Users },
  { to: "/wishlist", label: "Wish List", icon: Heart },
  { to: "/estanterias", label: "Estanterías", icon: BookMarked },
  { to: "/reading-habits", label: "Hábitos", icon: CalendarDays },
  { to: "/logros", label: "Logros", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/wrapped", label: "Wrapped", icon: Gift },
];

export default function Layout() {
  // ─── TUS HOOKS (sin cambios) ───
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
  const { addItem: addWishItem } = useWishlist();
  const { dark, setDark, themeId } = useTheme();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <BooksContext.Provider value={{ books, loading, addBook, addBooksInBatch, updateBook, deleteBook, addWishItem }}>
      <div className="min-h-screen bg-background">

        {/* ── Fondo de estrellas (solo tema Night) ── */}
        {themeId === "night" && (
          <div className="starfield">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: Math.random() * 0.5 + 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            SIDEBAR DESKTOP
           ══════════════════════════════════════════ */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:border-r border-border bg-card/95 backdrop-blur-xl">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-border/40">
              <div className="relative">
                <BookOpen className="h-7 w-7 text-primary" />
                <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1.5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight font-display text-foreground">
                Book Tracker
              </h1>
            </div>

            {/* Navegación */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`
                  }
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Controles de tema */}
            <div className="border-t border-border/40 p-4 space-y-2">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="flex w-full items-center justify-between rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Palette className="h-5 w-5" />
                  Tema
                </span>
              </button>
              {themeMenuOpen && <ThemeSelector />}

              <button
                onClick={() => setDark(!dark)}
                className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {dark ? "Modo Claro" : "Modo Oscuro"}
              </button>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            HEADER MÓVIL
           ══════════════════════════════════════════ */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-card/90 backdrop-blur-xl px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg">Book Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark(!dark)}
              className="hover:bg-secondary/80"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="hover:bg-secondary/80"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* ── Menú móvil ── */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <nav
              className="fixed top-14 right-0 bottom-0 w-72 bg-card border-l border-border p-4 space-y-1 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 mb-3">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-body">Tema</p>
                <ThemeSelector />
              </div>
              <div className="border-t border-border/40 pt-3">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }`
                    }
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        )}

        {/* ══════════════════════════════════════════
            CONTENIDO PRINCIPAL
           ══════════════════════════════════════════ */}
        <main className="lg:pl-64 pt-14 lg:pt-0 relative z-10">
          <div className="container py-4 md:py-8 space-y-0 page-transition">
            <Outlet />
          </div>
        </main>
      </div>

    </BooksContext.Provider>
  );
}
