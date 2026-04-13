Resumiendo lo que necesitas hacer:

---

### **Lo ÚNICO que tienes que cambiar es 1 archivo:**

**`Layout.tsx`** → Reemplaza tu `src/components/Layout.tsx`

Aquí está el contenido:
Action: file_editor view /app/theme-package/Layout.tsx
Observation: [Showing lines 1-244 of 244 total] /app/theme-package/Layout.tsx:
1|// Layout.tsx - DISTRIBUCIÓN SIDEBAR
2|// 
3|// CAMBIOS: Solo la estructura visual (sidebar desktop + mobile drawer)
4|// SIN TOCAR: BooksContext, hooks, GlobalSearch, EditBookDialog, Sheet
5|//
6|// NOTA: Este archivo usa tus imports y tu lógica exacta.
7|// Solo cambia el JSX del return.
8|
9|import { createContext, useContext, useState } from "react";
10|import { Outlet, NavLink } from "react-router-dom";
11|import { BookOpen, Menu, Moon, Sun, Sparkles, Palette, X,
12|  Library, Users, Heart, BookMarked, CalendarDays, Trophy, BarChart3, Gift, HelpCircle
13|} from "lucide-react";
14|import { ThemeSelector } from "@/components/ThemeSelector";
15|import { useBooks } from "@/hooks/useBooks";
16|import type { Book } from "@/hooks/useBooks";
17|import { useWishlist } from "@/hooks/useWishlist";
18|import type { WishItem } from "@/hooks/useWishlist";
19|import { Button } from "@/components/ui/button";
20|import { useTheme } from "@/hooks/useTheme";
21|import { GlobalSearch } from "@/components/GlobalSearch";
22|import { EditBookDialog } from "@/components/EditBookDialog";
23|
24|// ─── TU CONTEXT (sin cambios) ───
25|interface BooksContextType {
26|  books: Book[];
27|  loading: boolean;
28|  addBook: (data: Omit<Book, "id" | "addedAt">) => void;
29|  addBooksInBatch: (data: Omit<Book, "id" | "addedAt">[]) => Promise<Book[]>;
30|  updateBook: (id: string, data: Partial<Omit<Book, "id" | "addedAt">>) => void;
31|  deleteBook: (id: string) => void;
32|  addWishItem: (data: Omit<WishItem, "id">) => void;
33|}
34|
35|const BooksContext = createContext<BooksContextType | null>(null);
36|
37|export function useBooksContext() {
38|  const ctx = useContext(BooksContext);
39|  if (!ctx) throw new Error("useBooksContext must be used inside Layout");
40|  return ctx;
41|}
42|
43|// ─── LINKS CON ICONOS ───
44|const navLinks = [
45|  { to: "/", label: "Mi Biblioteca", icon: Library, end: true },
46|  { to: "/autores-sagas", label: "Autores y Sagas", icon: Users },
47|  { to: "/wishlist", label: "Wish List", icon: Heart },
48|  { to: "/estanterias", label: "Estanterías", icon: BookMarked },
49|  { to: "/reading-habits", label: "Hábitos", icon: CalendarDays },
50|  { to: "/logros", label: "Logros", icon: Trophy },
51|  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
52|  { to: "/wrapped", label: "Wrapped", icon: Gift },
53|];
54|
55|export default function Layout() {
56|  // ─── TUS HOOKS (sin cambios) ───
57|  const { books, loading, addBook, addBooksInBatch, updateBook, deleteBook } = useBooks();
58|  const { addItem: addWishItem } = useWishlist();
59|  const { dark, setDark, themeId } = useTheme();
60|  const [searchEditBook, setSearchEditBook] = useState<Book | null>(null);
61|  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
62|  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
63|
64|  return (
65|    <BooksContext.Provider value={{ books, loading, addBook, addBooksInBatch, updateBook, deleteBook, addWishItem }}>
66|      <div className="min-h-screen bg-background">
67|
68|        {/* ── Fondo de estrellas (solo tema Night) ── */}
69|        {themeId === "night" && (
70|          <div className="starfield">
71|            {[...Array(50)].map((_, i) => (
72|              <div
73|                key={i}
74|                className="star"
75|                style={{
76|                  left: `${Math.random() * 100}%`,
77|                  top: `${Math.random() * 100}%`,
78|                  animationDelay: `${Math.random() * 3}s`,
79|                  opacity: Math.random() * 0.5 + 0.3,
80|                }}
81|              />
82|            ))}
83|          </div>
84|        )}
85|
86|        {/* ══════════════════════════════════════════
87|            SIDEBAR DESKTOP
88|           ══════════════════════════════════════════ */}
89|        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:border-r border-border bg-card/95 backdrop-blur-xl">
90|          <div className="flex h-full flex-col">
91|            {/* Logo */}
92|            <div className="flex h-16 items-center gap-3 px-6 border-b border-border/40">
93|              <div className="relative">
94|                <BookOpen className="h-7 w-7 text-primary" />
95|                <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1.5" />
96|              </div>
97|              <h1 className="text-xl font-bold tracking-tight font-display text-foreground">
98|                Book Tracker
99|              </h1>
100|            </div>
101|
102|            {/* Búsqueda global */}
103|            <div className="px-3 py-3 border-b border-border/40">
104|              <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
105|            </div>
106|
107|            {/* Navegación */}
108|            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
109|              {navLinks.map((link) => (
110|                <NavLink
111|                  key={link.to}
112|                  to={link.to}
113|                  end={link.end}
114|                  className={({ isActive }) =>
115|                    `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium transition-all duration-200 ${
116|                      isActive
117|                        ? "bg-primary text-primary-foreground shadow-sm"
118|                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
119|                    }`
120|                  }
121|                >
122|                  <link.icon className="h-5 w-5 flex-shrink-0" />
123|                  {link.label}
124|                </NavLink>
125|              ))}
126|            </nav>
127|
128|            {/* Controles de tema */}
129|            <div className="border-t border-border/40 p-4 space-y-2">
130|              <button
131|                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
132|                className="flex w-full items-center justify-between rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
133|              >
134|                <span className="flex items-center gap-3">
135|                  <Palette className="h-5 w-5" />
136|                  Tema
137|                </span>
138|              </button>
139|              {themeMenuOpen && <ThemeSelector />}
140|
141|              <button
142|                onClick={() => setDark(!dark)}
143|                className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
144|              >
145|                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
146|                {dark ? "Modo Claro" : "Modo Oscuro"}
147|              </button>
148|            </div>
149|          </div>
150|        </aside>
151|
152|        {/* ══════════════════════════════════════════
153|            HEADER MÓVIL
154|           ══════════════════════════════════════════ */}
155|        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-card/90 backdrop-blur-xl px-4">
156|          <div className="flex items-center gap-2">
157|            <BookOpen className="h-6 w-6 text-primary" />
158|            <span className="font-display font-bold text-lg">Book Tracker</span>
159|          </div>
160|          <div className="flex items-center gap-1">
161|            <GlobalSearch books={books} onSelectBook={setSearchEditBook} />
162|            <Button
163|              variant="ghost"
164|              size="icon"
165|              onClick={() => setDark(!dark)}
166|              className="hover:bg-secondary/80"
167|            >
168|              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
169|            </Button>
170|            <Button
171|              variant="ghost"
172|              size="icon"
173|              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
174|              className="hover:bg-secondary/80"
175|            >
176|              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
177|            </Button>
178|          </div>
179|        </header>
180|
181|        {/* ── Menú móvil ── */}
182|        {mobileMenuOpen && (
183|          <div
184|            className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
185|            onClick={() => setMobileMenuOpen(false)}
186|          >
187|            <nav
188|              className="fixed top-14 right-0 bottom-0 w-72 bg-card border-l border-border p-4 space-y-1 overflow-y-auto"
189|              onClick={(e) => e.stopPropagation()}
190|            >
191|              <div className="px-2 mb-3">
192|                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-body">Tema</p>
193|                <ThemeSelector />
194|              </div>
195|              <div className="border-t border-border/40 pt-3">
196|                {navLinks.map((link) => (
197|                  <NavLink
198|                    key={link.to}
199|                    to={link.to}
200|                    end={link.end}
201|                    onClick={() => setMobileMenuOpen(false)}
202|                    className={({ isActive }) =>
203|                      `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-body font-medium transition-colors ${
204|                        isActive
205|                          ? "bg-primary text-primary-foreground"
206|                          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
207|                      }`
208|                    }
209|                  >
210|                    <link.icon className="h-5 w-5" />
211|                    {link.label}
212|                  </NavLink>
213|                ))}
214|              </div>
215|            </nav>
216|          </div>
217|        )}
218|
219|        {/* ══════════════════════════════════════════
220|            CONTENIDO PRINCIPAL
221|           ══════════════════════════════════════════ */}
222|        <main className="lg:pl-64 pt-14 lg:pt-0 relative z-10">
223|          <div className="container py-4 md:py-8 space-y-0 page-transition">
224|            <Outlet />
225|          </div>
226|        </main>
227|      </div>
228|
229|      {/* ── Dialog de edición (tu código original) ── */}
230|      {searchEditBook && (
231|        <EditBookDialog
232|          book={searchEditBook}
233|          open={!!searchEditBook}
234|          onOpenChange={(open) => { if (!open) setSearchEditBook(null); }}
235|          onSave={(id, data) => {
236|            updateBook(id, data);
237|            setSearchEditBook(null);
238|          }}
239|        />
240|      )}
241|    </BooksContext.Provider>
242|  );
243|}
244|
[End of file]
