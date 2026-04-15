import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Camera, X, Check, Calendar, User, Palette, Sun, Moon } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { profile, saveProfile, saving } = useProfile();
  const { dark, setDark, themeId, setThemeId, themes } = useTheme();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (!open) return null;

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-[var(--radius)] shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold font-display">Editar Perfil</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-[var(--radius)] hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <X className="h-3 w-3" />
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary hover:underline"
            >
              {avatarPreview ? "Cambiar foto" : "Subir foto"}
            </button>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Cumpleanos
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
          </div>

          {/* Email (read only) */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Theme Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Tema
            </label>
            <div className="space-y-2">
              {Object.values(themes).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setThemeId(theme.id)}
                  className={`w-full flex items-center justify-between rounded-[var(--radius)] px-3 py-2.5 text-sm transition-colors ${
                    themeId === theme.id
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted text-muted-foreground border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{theme.emoji}</span>
                    <span>{theme.name}</span>
                  </span>
                  {themeId === theme.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          {themeId !== "night" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                {dark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                Modo
              </label>
              <div className="flex rounded-[var(--radius)] border border-border overflow-hidden">
                <button
                  onClick={() => setDark(false)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                    !dark ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Claro
                </button>
                <button
                  onClick={() => setDark(true)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                    dark ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Oscuro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border sticky bottom-0 bg-card">
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
