import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Camera, X, Check, Calendar, User, Sun, Moon, Palette, Type, PaintBucket } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCENT_COLORS = [
  "#8B5CF6", "#EC4899", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#14B8A6", "#3B82F6", "#6366F1", "#A855F7",
];

const BG_COLORS = [
  "#1a1025", "#0f172a", "#18181b", "#1c1917", "#0c0a09",
  "#faf5ff", "#f0f9ff", "#fafafa", "#fef3c7", "#f5f5f4",
];

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { profile, saveProfile, saving } = useProfile();
  const { dark, setDark, themeId, setThemeId, themes, customAccent, setCustomAccent, customBg, setCustomBg } = useTheme();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accentInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(profile.displayName);
      setBirthday(profile.birthday);
      setAvatarPreview(profile.avatarUrl);
    }
  }, [open, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("La imagen es demasiado grande. Maximo 500KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        setAvatarPreview(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    await saveProfile({ displayName: name.trim(), birthday, avatarUrl: avatarPreview });
    onOpenChange(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectCustom = () => { if (themeId !== "custom") setThemeId("custom"); };

  if (!open) return null;

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "?";

  const presetThemes = Object.values(themes).filter((t) => t.id !== "custom");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/45 bg-gradient-to-br from-primary/[0.16] via-card to-card p-6">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Tu rincón lector</p>
            <h2 className="font-display text-2xl font-semibold">Personaliza tu perfil</h2>
            <p className="mt-1 text-sm text-muted-foreground">Haz que la biblioteca se sienta un poco más tuya.</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-[var(--radius)] hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5 sm:p-6">
          {/* Avatar + Name */}
          <section className="rounded-2xl border border-border/40 bg-muted/[0.16] p-4">
          <div className="flex items-center gap-4">
            <div className="relative group flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full border-2 border-primary/40 object-cover shadow-lg" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/15 shadow-lg">
                  <span className="font-display text-2xl font-bold text-primary">{initials}</span>
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </button>
              {avatarPreview && (
                <button onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90">
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nombre lector</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground truncate px-1">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-xs font-medium text-primary hover:text-primary/80">Cambiar foto de perfil</button>
          </section>

          {/* Birthday */}
          <section className="rounded-2xl border border-border/40 bg-muted/[0.16] p-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Calendar className="h-3.5 w-3.5 text-primary" /> Fecha de nacimiento</label>
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </section>

          {/* Theme selector: 3 presets + custom */}
          <section className="space-y-3 rounded-2xl border border-border/40 bg-muted/[0.16] p-4">
            <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              El ambiente de tu biblioteca
            </label>
            <p className="mt-1 text-xs text-muted-foreground">Elige una atmósfera o crea la tuya.</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {presetThemes.map((theme) => (
                <button key={theme.id} onClick={() => setThemeId(theme.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] transition-all ${
                    themeId === theme.id ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/35" : "border-transparent bg-background/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}>
                  <span className="flex h-8 w-full items-center justify-center rounded-lg text-base" style={{ background: `linear-gradient(135deg, ${theme.dark["--background"]}, ${theme.dark["--primary"]})` }}>{theme.emoji}</span>
                  <span className="truncate w-full text-center leading-tight">{theme.name.split(" ").pop()}</span>
                </button>
              ))}
              <button onClick={() => setThemeId("custom")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] transition-all ${
                  themeId === "custom" ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/35" : "border-transparent bg-background/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}>
                <div className="flex h-8 w-full items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${customBg}, ${customAccent})` }}><div className="h-3 w-3 rounded-full border border-white/50" style={{ backgroundColor: customAccent }} /></div>
                <span className="truncate w-full text-center leading-tight">Custom</span>
              </button>
            </div>
          </section>

          {/* Custom color pickers */}
          {themeId === "custom" && (
            <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.045] p-4">
              {/* Accent color */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Type className="h-3 w-3" />
                  Color acento
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {ACCENT_COLORS.map((color) => (
                    <button key={color} onClick={() => { setCustomAccent(color); selectCustom(); }}
                      className={`w-6 h-6 rounded-full transition-all ${
                        customAccent === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : "hover:scale-110"
                      }`} style={{ backgroundColor: color }} />
                  ))}
                  <button onClick={() => accentInputRef.current?.click()}
                    className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground hover:border-foreground transition-colors flex items-center justify-center"
                    title="Elegir color"><span className="text-[10px]">+</span></button>
                  <input ref={accentInputRef} type="color" value={customAccent}
                    onChange={(e) => { setCustomAccent(e.target.value); selectCustom(); }} className="sr-only" />
                </div>
              </div>

              {/* Background color */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <PaintBucket className="h-3 w-3" />
                  Color fondo
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {BG_COLORS.map((color) => (
                    <button key={color} onClick={() => { setCustomBg(color); selectCustom(); }}
                      className={`w-6 h-6 rounded-full transition-all border border-border/50 ${
                        customBg === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : "hover:scale-110"
                      }`} style={{ backgroundColor: color }} />
                  ))}
                  <button onClick={() => bgInputRef.current?.click()}
                    className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground hover:border-foreground transition-colors flex items-center justify-center"
                    title="Elegir color"><span className="text-[10px]">+</span></button>
                  <input ref={bgInputRef} type="color" value={customBg}
                    onChange={(e) => { setCustomBg(e.target.value); selectCustom(); }} className="sr-only" />
                </div>
              </div>
            </div>
          )}

          {/* Dark/Light toggle */}
          <section className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/[0.16] p-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
              {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Modo
            </label>
            <div className="flex-1 flex rounded-[var(--radius)] border border-border overflow-hidden">
              <button onClick={() => setDark(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                  !dark ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}><Sun className="h-3.5 w-3.5" />Claro</button>
              <button onClick={() => setDark(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                  dark ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}><Moon className="h-3.5 w-3.5" />Oscuro</button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-[var(--radius)] border border-border hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm rounded-[var(--radius)] bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
            <Check className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

