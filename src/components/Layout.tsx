import { createContext, useContext, useState } from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { BookOpen, LogOut, Menu, Moon, Sun, User, Sparkles } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import type { Book } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/useTheme";
import ProfileDialog from "@/components/ProfileDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { EditBookDialog } from "@/components/EditBookDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  updateBook: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void;
  deleteBook: (id: string) => void;
}

const BooksContext = createContext<BooksContextType | null>(null);

export function useBooksContext() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error("useBooksContext must be used inside Layout");
  return ctx;
}

function getInitials(email?: string, name?: string): string {
  if (name) {
    return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

export default function Layout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { books, loading, addBook, updateBook, deleteBook } = useBooks();
  const { dark, setDark } = useTheme();
  const [searchEditBook, setSearchEditBook] = useState<Book | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Auth disabled — no redirect needed

  const displayName = user.user_metadata?.display_name || user.email;
  const initials = getInitials(user.email, user.user_metadata?.display_name);

  const navLinks = [
    { to: "/", label: "Mi Biblioteca", end: true },
    { to: "/autores-sagas", label: "Autores y Sagas" },
    { to: "/wishlist", label: "Wish List" },
    { to: "/estanterias", label: "Estanterías" },
    { to: "/reading-habits", label: "Hábitos" },
    { to: "/logros", label: "Logros" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/wrapped", label: "Wrapped ✨" },
  ];

  return (
    <BooksContext.Provider value={{ books, loading, addBook, updateBook, deleteBook }}>
      <div className="min-h-screen">
        <header className="border-b border-border/40 bg-card/90 backdrop-blur-xl sticky top-0 z-10">
          <div className="container flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <BookOpen className="h-7 w-7 text-primary" />
                <Sparkles className="h-3 w-3 text-warm-gold absolute -top-1 -right-1.5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight font-display text-foreground">Book Tracker</h1>
            </div>

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
              <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="ml-1 hover:bg-warm-gold/10 hover:text-warm-gold transition-colors">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-2 gap-2 px-2 hover:bg-secondary/80">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 warm-shadow">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none font-display">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ProfileDialog>
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil y Tema
                    </DropdownMenuItem>
                  </ProfileDialog>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-1">
              <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
              <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="hover:bg-warm-gold/10">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 warm-shadow">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none font-display">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ProfileDialog>
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil y Tema
                    </DropdownMenuItem>
                  </ProfileDialog>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-secondary/80">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 pt-10 bg-card">
                  <div className="flex items-center gap-2 mb-6 px-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-display text-lg">Menú</span>
                  </div>
                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.to}>
                        <NavLink
                          to={link.to}
                          end={link.end}
                          className={({ isActive }) =>
                            `px-4 py-3 rounded-lg text-sm font-body transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground warm-shadow" 
                                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                            }`
                          }
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
        <main className="container py-8 space-y-0 page-transition">
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
