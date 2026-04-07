import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Palette, User, Check, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileDialogProps {
  children: React.ReactNode;
}

export default function ProfileDialog({ children }: ProfileDialogProps) {
  const { user } = useAuth();
  const { themeId, setThemeId, customHue, setCustomHue, presets, dark, setDark } = useTheme();

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("profiles")
      .select("display_name, bio, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setBio((data as any).bio || "");
          setAvatarUrl(data.avatar_url || "");
        }
      });
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio: bio as any,
        avatar_url: avatarUrl || null,
      } as any)
      .eq("user_id", user.id);

    if (!error) {
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      toast.success("Perfil actualizado");
      setOpen(false);
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Error al subir la imagen");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    setUploading(false);
    toast.success("Avatar subido");
  };

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <User className="h-5 w-5" /> Mi Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Foto de perfil</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="flex-1"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-1" /> Subir foto</>
                  )}
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Nombre</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Cuéntanos sobre ti como lector..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Theme selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" /> Tema de colores
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setThemeId(p.id)}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    themeId === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  {themeId === p.id && (
                    <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                  )}
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-xs font-body">{p.name}</span>
                  <div className="flex gap-0.5 mt-1">
                    {["--primary", "--accent", "--reading"].map(varName => (
                      <div
                        key={varName}
                        className="h-2 w-4 rounded-full"
                        style={{ backgroundColor: `hsl(${dark ? p.dark[varName] : p.light[varName]})` }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom color */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setCustomHue(customHue ?? 200)}
                className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  themeId === "custom"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-xl">🎨</span>
                <span className="text-xs font-body font-semibold">Color personalizado</span>
                {themeId === "custom" && <Check className="ml-auto h-3 w-3 text-primary" />}
              </button>
              {themeId === "custom" && (
                <div className="px-2 space-y-2">
                  <div
                    className="h-6 rounded-lg"
                    style={{
                      background: `linear-gradient(to right, ${Array.from({ length: 12 }, (_, i) => `hsl(${i * 30}, 50%, 45%)`).join(", ")})`,
                    }}
                  />
                  <Slider
                    min={0}
                    max={359}
                    step={1}
                    value={[customHue ?? 200]}
                    onValueChange={([v]) => setCustomHue(v)}
                  />
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
