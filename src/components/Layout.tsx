import { createContext, useContext, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Library, Users, Heart, BookMarked, CalendarDays,
  Trophy, Sparkles, Palette, Sun, Moon, Menu, X, Search,
  TrendingUp, HelpCircle, Zap, LogOut,
} from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import type { Book } from "@/hooks/useBooks";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem } from "@/hooks/useWishlist";
import { useTheme } from "@/hooks/useTheme";
import { ThemeSelector } from "@/components/ThemeSelector";
import { GlobalSearch } from "@/components/GlobalSearch";
import { EditBookDialog } from "@/components/EditBookDialog";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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

const navLinks = [
  { to: "/biblioteca", label: "Biblioteca", icon: <Library className="h-5 w-5" /> },
  { to: "/autores-sagas", label: "Autores y Sagas", icon: <Users className="h-5 w-5" /> },
  { to: "/wishlist", label: "Wish List", icon: <Heart className="h-5 w-5" /> },
  { to: "/estanterias", label: "Estantería", icon: <BookMarked className="h-5 w-5" /> },
  { to: "/reading-habits", label: "Hábitos", icon: <CalendarDays className="h-5 w-5" /> },
  { to: "/logros", label: "Logros", icon: <Trophy className="h-5 w-5" /> },
  { to: "/dashboard", label: "Dashboard", icon: <TrendingUp className="h-5 w-5" /> },
  { to: "/wrapped", label: "Wrapped ✨", icon: <Sparkles className="h-5 w-5" /> },
  { to: "/ayuda", label: "Ayuda", icon: <HelpCircle className="h-5 w-5" /> },
];

function NavItem({ to, label, icon, onClick }: { to: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { signOut, user } = useAuth();
  const { dark, setDark, themeId } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border shrink-0">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: "var(--primary)", opacity: 0.9 }}>
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight font-display leading-none">Book Tracker</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Tu diario lector</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navLinks.map((link) => (
          <NavItem key={link.to} {...link} onClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom: Tema + Dark mode */}
      <div className="border-t border-border px-3 py-4 space-y-1 shrink-0">
        <button
          onClick={() => setThemeOpen(!themeOpen)}
          className="w-full flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Palette className="h-5 w-5" />
          Tema
        </button>

        {themeOpen && (
          <div className="px-1 pb-2">
            <ThemeSelector />
          </div>
        )}

        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {dark ? "Modo Claro" : "Modo Oscuro"}
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
  const { themeId } = useTheme();
  const { addItem: addWishItem } = useWishlist();
  const [searchEditBook, setSearchEditBook] = useState<Book | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BooksContext.Provider value={{ books, loading, addBook, addBooksInBatch, updateBook, deleteBook, addWishItem }}>
      <div className="min-h-screen bg-background">

        

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:border-r border-border bg-card">
          <SidebarContent />
        </aside>

        {/* ── Mobile Header ── */}
        <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between px-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <Link to="/biblioteca" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}>
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold font-display text-base">Book Tracker</span>
          </Link>
          <div className="flex items-center gap-1">
            <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 border-r border-border bg-card">
                <SidebarContent onNavClick={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* ── Main Content ── */}
        <div className="lg:pl-64">
          {/* Desktop top bar with search */}
          <div className="hidden lg:flex sticky top-0 z-30 h-14 items-center justify-end px-8 border-b border-border bg-background/95 backdrop-blur-sm">
            <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
          </div>

          <main className="px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>

        {/* Edit dialog from search */}
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
