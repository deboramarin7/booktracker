import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Camera, X, Check, Calendar, User, Sun, Moon, Palette } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#8B5CF6", "#EC4899", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#14B8A6", "#3B82F6", "#6366F1", "#A855F7",
];

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { profile, saveProfile, saving } = useProfile();
  const { dark, setDark, themeId, setThemeId, themes, customColor, setCustomColor } = useTheme();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

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
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setAvatarPreview(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    await saveProfile({
      displayName: name.trim(),
      birthday: birthday,
      avatarUrl: avatarPreview,
    });
    onOpenChange(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    if (themeId !== "custom") setThemeId("custom");
  };

  if (!open) return null;

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "?";

  // Separate preset themes from custom
  const presetThemes = Object.values(themes).filter((t) => t.id !== "custom");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-[var(--radius)] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold font-display">Editar Perfil</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-[var(--radius)] hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Avatar + Name row */}
          <div className="flex items-center gap-4">
            <div className="relative group flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                  <span className="text-xl font-bold text-primary">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-[11px] text-muted-foreground truncate px-1">{user?.email}</p>
            </div>
          </div>

          {/* Birthday */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Theme - 3 presets + custom in a row */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Tema
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presetThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setThemeId(theme.id)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-[var(--radius)] text-[11px] transition-all ${
                    themeId === theme.id
                      ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{theme.emoji}</span>
                  <span className="truncate w-full text-center leading-tight">{theme.name.split(" ").pop()}</span>
                </button>
              ))}
              {/* Custom theme button */}
              <button
                onClick={() => setThemeId("custom")}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-[var(--radius)] text-[11px] transition-all ${
                  themeId === "custom"
                    ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-current"
                  style={{ backgroundColor: customColor }}
                />
                <span className="truncate w-full text-center leading-tight">Custom</span>
              </button>
            </div>
          </div>

          {/* Custom color picker (only when custom theme selected) */}
          {themeId === "custom" && (
            <div className="space-y-3 p-3 rounded-[var(--radius)] bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground flex-shrink-0">Color:</label>
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleCustomColorChange(color)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        customColor === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {/* Custom color input */}
                  <button
                    onClick={() => colorInputRef.current?.click()}
                    className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground hover:border-foreground transition-colors flex items-center justify-center"
                    title="Elegir color"
                  >
                    <span className="text-[10px]">+</span>
                  </button>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dark/Light toggle */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
              {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Modo
            </label>
            <div className="flex-1 flex rounded-[var(--radius)] border border-border overflow-hidden">
              <button
                onClick={() => setDark(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                  !dark ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Claro
              </button>
              <button
                onClick={() => setDark(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                  dark ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Oscuro
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm rounded-[var(--radius)] border border-border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-[var(--radius)] bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
