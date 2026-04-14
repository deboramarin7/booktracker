import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useBooksContext } from "@/components/Layout";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Sparkles, BookOpen, Star,
  Flame, Trophy, BarChart2, Users, Layers, ImageDown, Zap,
} from "lucide-react";

function getYear(book: { endDate?: string; startDate?: string; addedAt: string }): number {
  const d = new Date(book.endDate || book.startDate || book.addedAt);
  return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function GlowNumber({ value, color = "emerald" }: { value: number | string; color?: string }) {
  const colors: Record<string, string> = {
    emerald: "#10b981", purple: "#a855f7", rose: "#f43f5e", amber: "#f59e0b", blue: "#3b82f6",
  };
  const hex = colors[color] || colors.emerald;
  return (
    <span className="font-black leading-none tracking-tighter select-none" style={{
      fontSize: "clamp(80px, 22vw, 160px)", color: "#fff",
      textShadow: `0 0 40px ${hex}cc, 0 0 80px ${hex}88, 0 0 120px ${hex}44`,
      fontVariantNumeric: "tabular-nums",
    }}>
      {value}
    </span>
  );
}

function GradientText({ children, from, to }: { children: React.ReactNode; from: string; to: string }) {
  return (
    <span className="font-bold bg-clip-text text-transparent"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
      {children}
    </span>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 ${className}`}
      style={{ background: "rgba(5,10,20,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      {children}
    </div>
  );
}

function BookCover({ src, alt, size = 80 }: { src?: string; alt: string; size?: number }) {
  return (
    <div className="rounded-xl overflow-hidden flex-shrink-0 border border-white/10"
      style={{ width: size, height: size * 1.5, background: "linear-gradient(135deg,#1a2a1a,#0d1117)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" />
           : <div className="w-full h-full flex items-center justify-center"><BookOpen className="text-emerald-500/40" style={{ width: size * 0.35, height: size * 0.35 }} /></div>}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => <Star key={i} className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-white/20"} size={18} />)}
    </div>
  );
}

function SlideIntro({ totalBooks, year, books }: { totalBooks: number; year: number; books: any[] }) {
  const covers = books.slice(0, 6);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-10 text-center">
      <p className="text-xs font-semibold tracking-[0.4em] text-emerald-400/80 uppercase">Tu año lector · {year}</p>
      <GlowNumber value={totalBooks} color="emerald" />
      <p className="text-2xl text-white/70 font-light -mt-4">libros terminados</p>
      {covers.length > 0 && (
        <div className="flex gap-3 mt-4 items-end">
          {covers.map((b, i) => (
            <div key={b.id} className="transition-transform duration-300 hover:scale-110" style={{ transform: `rotate(${(i - 2.5) * 4}deg)` }}>
              <BookCover src={b.coverUrl} alt={b.title} size={52} />
            </div>
          ))}
          {books.length > 6 && (
            <div className="rounded-xl flex items-center justify-center text-white/60 font-bold text-sm border border-white/10 flex-shrink-0"
              style={{ width: 52, height: 78, background: "rgba(255,255,255,0.05)" }}>
              +{books.length - 6}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlidePages({ totalPages }: { totalPages: number }) {
  const novels = Math.round(totalPages / 250);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-10 text-center">
      <div className="p-4 rounded-2xl border border-emerald-500/20" style={{ background: "rgba(16,185,129,0.08)" }}>
        <BookOpen className="text-emerald-400" size={32} />
      </div>
      <GlowNumber value={totalPages.toLocaleString("es-ES")} color="emerald" />
      <p className="text-2xl text-white/70 font-light -mt-4">páginas leídas</p>
      <div className="flex gap-4 mt-2">
        <GlassCard className="px-5 py-3 text-center">
          <p className="text-2xl font-bold text-white">≈ {novels}</p>
          <p className="text-xs text-white/50 mt-1">novelas estándar</p>
        </GlassCard>
      </div>
    </div>
  );
}

function SlideBestMonth({ monthData }: { monthData: { name: string; count: number; monthly: { name: string; count: number }[] } }) {
  const max = Math.max(...monthData.monthly.map(m => m.count), 1);
  const colors = ["#10b981","#a855f7","#f43f5e","#3b82f6","#f59e0b","#06b6d4","#10b981","#a855f7","#f43f5e","#3b82f6","#f59e0b","#06b6d4"];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 py-10 text-center">
      <div className="p-4 rounded-2xl border border-purple-500/20" style={{ background: "rgba(168,85,247,0.08)" }}>
        <Trophy className="text-purple-400" size={32} />
      </div>
      <p className="text-sm font-semibold tracking-[0.3em] text-purple-400/80 uppercase">Mejor mes</p>
      <GradientText from="#a855f7" to="#ec4899">
        <span style={{ fontSize: "clamp(40px,12vw,72px)", fontWeight: 900, lineHeight: 1 }}>{monthData.name}</span>
      </GradientText>
      <p className="text-white/60 text-lg -mt-1">{monthData.count} libros ese mes</p>
      <GlassCard className="w-full max-w-sm p-4 mt-2">
        <div className="flex items-end gap-1.5 h-20 justify-center">
          {monthData.monthly.map((m, i) => {
            const h = max > 0 ? Math.max(4, (m.count / max) * 68) : 4;
            return (
              <div key={m.name} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full rounded-t" style={{ height: h, background: m.name === monthData.name ? colors[i] : "rgba(255,255,255,0.12)" }} />
                <span className="text-[8px] text-white/30">{m.name.substring(0,1)}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function SlideGenre({ genreData }: { genreData: [string, number][] }) {
  const top = genreData[0];
  const total = genreData.reduce((s, [, v]) => s + v, 0);
  const gradients = ["linear-gradient(90deg,#10b981,#06b6d4)","linear-gradient(90deg,#a855f7,#ec4899)","linear-gradient(90deg,#f59e0b,#f97316)","linear-gradient(90deg,#3b82f6,#6366f1)","linear-gradient(90deg,#f43f5e,#ec4899)"];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 py-10 text-center">
      <div className="p-4 rounded-2xl border border-blue-500/20" style={{ background: "rgba(59,130,246,0.08)" }}>
        <Layers className="text-blue-400" size={32} />
      </div>
      <p className="text-sm font-semibold tracking-[0.3em] text-blue-400/80 uppercase">Género favorito</p>
      {top ? (
        <>
          <GradientText from="#3b82f6" to="#a855f7">
            <span style={{ fontSize: "clamp(32px,10vw,60px)", fontWeight: 900, lineHeight: 1.1 }}>{top[0]}</span>
          </GradientText>
          <p className="text-white/50 -mt-2">{top[1]} libro{top[1] !== 1 ? "s" : ""}</p>
          <GlassCard className="w-full max-w-sm p-4 mt-1 flex flex-col gap-3">
            {genreData.slice(0, 5).map(([name, count], i) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/80">{name}</span>
                  <span className="text-white/40">{Math.round((count / total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, background: gradients[i] }} />
                </div>
              </div>
            ))}
          </GlassCard>
        </>
      ) : <p className="text-white/40">Sin datos de géneros</p>}
    </div>
  );
}

function SlideTopAuthor({ author, books }: { author: string; books: any[] }) {
  const authorBooks = books.filter(b => b.author === author);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 py-10 text-center">
      <div className="p-4 rounded-2xl border border-rose-500/20" style={{ background: "rgba(244,63,94,0.08)" }}>
        <Users className="text-rose-400" size={32} />
      </div>
      <p className="text-sm font-semibold tracking-[0.3em] text-rose-400/80 uppercase">Autor más leído</p>
      <GradientText from="#f43f5e" to="#a855f7">
        <span style={{ fontSize: "clamp(28px,8vw,52px)", fontWeight: 900, lineHeight: 1.1 }}>{author}</span>
      </GradientText>
      <p className="text-white/50 -mt-1">{authorBooks.length} libro{authorBooks.length !== 1 ? "s" : ""} este año</p>
      <div className="flex gap-3 pb-2 max-w-full mt-1 justify-center flex-wrap">
        {authorBooks.slice(0, 6).map(b => (
          <div key={b.id} className="transition-transform hover:scale-105"><BookCover src={b.coverUrl} alt={b.title} size={56} /></div>
        ))}
      </div>
    </div>
  );
}

function SlideBookOfYear({ book }: { book: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 py-10 text-center">
      <div className="p-4 rounded-2xl border border-amber-500/20" style={{ background: "rgba(245,158,11,0.08)" }}>
        <Star className="text-amber-400" size={32} />
      </div>
      <p className="text-sm font-semibold tracking-[0.3em] text-amber-400/80 uppercase">Libro del año</p>
      <div className="transition-transform hover:scale-105 duration-300"><BookCover src={book.coverUrl} alt={book.title} size={100} /></div>
      <div className="flex flex-col items-center gap-1 max-w-xs">
        <p className="text-xl font-bold text-white leading-tight">{book.title}</p>
        <p className="text-white/50 text-sm">{book.author}</p>
        <div className="mt-2"><StarRating rating={book.rating} /></div>
      </div>
    </div>
  );
}

function SlideRhythm({ stats }: { stats: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 py-10 text-center">
      <div className="p-4 rounded-2xl border border-cyan-500/20" style={{ background: "rgba(6,182,212,0.08)" }}>
        <Zap className="text-cyan-400" size={32} />
      </div>
      <p className="text-sm font-semibold tracking-[0.3em] text-cyan-400/80 uppercase">Ritmo lector</p>
      <div className="flex gap-3 mt-1 flex-wrap justify-center">
        <GlassCard className="px-5 py-4 text-center">
          <GradientText from="#06b6d4" to="#3b82f6">
            <span className="text-4xl font-black">{stats.daysPerBook}</span>
          </GradientText>
          <p className="text-xs text-white/40 mt-1">días por libro</p>
        </GlassCard>
        <GlassCard className="px-5 py-4 text-center">
          <GradientText from="#10b981" to="#06b6d4">
            <span className="text-4xl font-black">{stats.streak}</span>
          </GradientText>
          <p className="text-xs text-white/40 mt-1">días de racha</p>
        </GlassCard>
      </div>
      {stats.fastest && (
        <GlassCard className="w-full max-w-sm p-4 mt-1">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Libro más rápido</p>
          <div className="flex items-center gap-3">
            <BookCover src={stats.fastest.coverUrl} alt={stats.fastest.title} size={44} />
            <div className="text-left">
              <p className="text-white font-semibold text-sm leading-tight">{stats.fastest.title}</p>
              <p className="text-white/40 text-xs mt-0.5">{stats.fastest.days} días</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function SlideFinal({ stats }: { stats: any }) {
  const msgs = ["¡Eres una máquina lectora! 🔥","Las historias te han elegido. ✨","Otro año, otra vida leída. 📚","Los libros son tus mejores amigos. 🌟"];
  const msg = msgs[stats.totalBooks % msgs.length];
  const grid = [
    { icon: BookOpen,  label: "Libros",   value: stats.totalBooks, color: "#10b981" },
    { icon: BarChart2, label: "Páginas",  value: stats.totalPages.toLocaleString("es-ES"), color: "#a855f7" },
    { icon: Users,     label: "Autores",  value: stats.totalAuthors, color: "#f43f5e" },
    { icon: Layers,    label: "Géneros",  value: stats.totalGenres, color: "#f59e0b" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-10 text-center">
      <Sparkles className="text-emerald-400" size={36} />
      <GradientText from="#10b981" to="#a855f7">
        <span className="text-3xl font-black">Tu {stats.year} en números</span>
      </GradientText>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-1">
        {grid.map(({ icon: Icon, label, value, color }) => (
          <GlassCard key={label} className="p-4 text-center">
            <Icon size={20} style={{ color }} className="mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="px-6 py-4 max-w-sm mt-1">
        <p className="text-white/80 text-base leading-relaxed">{msg}</p>
      </GlassCard>
    </div>
  );
}

export default function Wrapped() {
  const { books } = useBooksContext();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animDir, setAnimDir] = useState<"left"|"right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number|null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const years = useMemo(() => {
    const s = new Set(books.map(b => getYear(b)));
    s.add(new Date().getFullYear());
    return Array.from(s).sort((a,b) => b-a);
  }, [books]);

  const yearBooks = useMemo(
    () => books.filter(b => b.status === "finished" && getYear(b) === selectedYear),
    [books, selectedYear]
  );

  const stats = useMemo(() => {
    const totalBooks   = yearBooks.length;
    const totalPages   = yearBooks.reduce((s,b) => s + (b.pageCount||b.numPages||b.pages||0), 0);
    const totalAuthors = new Set(yearBooks.map(b => b.author)).size;
    const totalGenres  = new Set(yearBooks.filter(b => b.genre).map(b => b.genre)).size;
    const monthCount: number[] = Array(12).fill(0);
    yearBooks.forEach(b => {
      const d = new Date(b.endDate||b.startDate||b.addedAt);
      if (!isNaN(d.getTime())) monthCount[d.getMonth()]++;
    });
    const monthly = MONTHS.map((name,i) => ({ name, count: monthCount[i] }));
    const bestMonthIdx = monthCount.indexOf(Math.max(...monthCount));
    const bestMonth = { name: MONTHS[bestMonthIdx], count: monthCount[bestMonthIdx], monthly };
    const genreMap: Record<string,number> = {};
    yearBooks.forEach(b => { if (b.genre) genreMap[b.genre] = (genreMap[b.genre]||0)+1; });
    const genreData = Object.entries(genreMap).sort((a,b) => b[1]-a[1]) as [string,number][];
    const authorMap: Record<string,number> = {};
    yearBooks.forEach(b => { authorMap[b.author] = (authorMap[b.author]||0)+1; });
    const topAuthor = Object.entries(authorMap).sort((a,b) => b[1]-a[1])[0]?.[0] || "";
    const bookOfYear = [...yearBooks].filter(b => b.rating>0).sort((a,b) => b.rating-a.rating)[0] || yearBooks[0];
    let daysPerBook = 0;
    if (totalBooks > 0) {
      const totalDays = yearBooks.reduce((s,b) => {
        const start = new Date(b.startDate||b.addedAt);
        const end   = new Date(b.endDate||b.addedAt);
        return s + Math.max(1, Math.round((end.getTime()-start.getTime())/86400000));
      }, 0);
      daysPerBook = Math.round(totalDays/totalBooks);
    }
    const fastest = yearBooks.map(b => {
      const start = new Date(b.startDate||b.addedAt);
      const end   = new Date(b.endDate||b.addedAt);
      return { ...b, days: Math.max(1, Math.round((end.getTime()-start.getTime())/86400000)) };
    }).sort((a,b) => a.days-b.days)[0];
    const readDays = new Set<string>();
    yearBooks.forEach(b => {
      const d = new Date(b.endDate||b.addedAt);
      if (!isNaN(d.getTime())) readDays.add(d.toISOString().slice(0,10));
    });
    return { totalBooks, totalPages, totalAuthors, totalGenres, monthly, bestMonth, genreData, topAuthor, bookOfYear, daysPerBook, fastest, streak: readDays.size, year: selectedYear };
  }, [yearBooks, selectedYear]);

  const slides = useMemo(() => [
    { id: "intro" }, { id: "pages" }, { id: "month" }, { id: "genre" },
    { id: "author" }, ...(stats.bookOfYear ? [{ id: "book" }] : []),
    { id: "final" },
  ], [stats.bookOfYear]);

  const totalSlides = slides.length;

  const goTo = useCallback((idx: number, dir: "left"|"right") => {
    if (isAnimating || idx < 0 || idx >= totalSlides) return;
    setAnimDir(dir);
    setIsAnimating(true);
    setTimeout(() => { setCurrentSlide(idx); setIsAnimating(false); }, 250);
  }, [isAnimating, totalSlides]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(currentSlide+1, "right");
      if (e.key === "ArrowLeft")  goTo(currentSlide-1, "left");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [currentSlide, goTo]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? goTo(currentSlide+1,"right") : goTo(currentSlide-1,"left");
    touchStartX.current = null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!(window as any).html2canvas) {
        await new Promise<void>((res,rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = () => res(); s.onerror = () => rej();
          document.head.appendChild(s);
        });
      }
      const canvas = await (window as any).html2canvas(captureRef.current, { useCORS: true, scale: 2 });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `wrapped-${selectedYear}.png`;
      a.click();
    } catch(e) { console.error(e); }
    setIsSaving(false);
  };

  const renderSlide = () => {
    const id = slides[currentSlide]?.id;
    if (id === "intro")  return <SlideIntro totalBooks={stats.totalBooks} year={selectedYear} books={yearBooks} />;
    if (id === "pages")  return <SlidePages totalPages={stats.totalPages} />;
    if (id === "month")  return <SlideBestMonth monthData={stats.bestMonth} />;
    if (id === "genre")  return <SlideGenre genreData={stats.genreData} />;
    if (id === "author") return <SlideTopAuthor author={stats.topAuthor} books={yearBooks} />;
    if (id === "book")   return stats.bookOfYear ? <SlideBookOfYear book={stats.bookOfYear} /> : null;

    if (id === "final")  return <SlideFinal stats={stats} />;
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020812" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <img src="/nebulosa.png" alt="" className="w-full h-full object-cover" style={{ opacity: 0.85 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.12) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(244,114,182,0.10) 0%, transparent 40%)" }} />
      </div>

      <div className="relative flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ zIndex: 10, background: "rgba(2,8,18,0.6)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald-400" size={18} />
          <span className="font-bold text-white text-sm tracking-wide">Wrapped {selectedYear}</span>
        </div>
        <Select value={String(selectedYear)} onValueChange={v => { setSelectedYear(Number(v)); setCurrentSlide(0); }}>
          <SelectTrigger className="w-24 h-8 text-xs border-white/20 text-white" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>
            {years.map(y => <SelectItem key={y} value={String(y)} className="text-white/80">{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 border border-white/15 hover:border-white/30 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
          <ImageDown size={13} />
          {isSaving ? "..." : "Guardar"}
        </button>
      </div>

      <div ref={captureRef} className="relative flex-1 flex flex-col overflow-hidden" style={{ zIndex: 1 }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex-1" style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? `translateX(${animDir === "right" ? "-30px" : "30px"})` : "translateX(0)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}>
          {renderSlide()}
        </div>
        <div className="flex justify-center gap-1.5 pb-2">
          {slides.map((_,i) => (
            <button key={i} onClick={() => goTo(i, i > currentSlide ? "right" : "left")}
              className="rounded-full transition-all duration-300"
              style={{ width: i === currentSlide ? 24 : 6, height: 6, background: i === currentSlide ? "#10b981" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <div className="flex items-center justify-between px-4 pb-4 gap-3">
          <button onClick={() => goTo(currentSlide-1,"left")} disabled={currentSlide===0}
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/15 text-white hover:border-white/30 disabled:opacity-30 transition-all"
            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            <ChevronLeft size={20} />
          </button>
          <p className="text-xs text-white/30 text-center">Desliza o usa ← → para navegar</p>
          <button onClick={() => goTo(currentSlide+1,"right")} disabled={currentSlide===totalSlides-1}
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/15 text-white hover:border-white/30 disabled:opacity-30 transition-all"
            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
