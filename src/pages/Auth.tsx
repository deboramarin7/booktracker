import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { BookOpen, Mail, Lock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Email enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña." });
        setMode("login");
      }
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName);
      setLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "¡Cuenta creada!", description: "Revisa tu email para confirmar tu cuenta antes de iniciar sesión." });
        setMode("login");
      }
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-[0.06] rotate-[-15deg] select-none">📚</div>
        <div className="absolute top-20 right-20 text-5xl opacity-[0.05] rotate-[10deg] select-none">📖</div>
        <div className="absolute bottom-20 left-20 text-7xl opacity-[0.04] rotate-[5deg] select-none">📕</div>
        <div className="absolute bottom-10 right-10 text-5xl opacity-[0.06] rotate-[-8deg] select-none">✨</div>
        <div className="absolute top-1/3 left-1/4 text-4xl opacity-[0.04] rotate-[20deg] select-none">🕯️</div>
        <div className="absolute bottom-1/3 right-1/4 text-4xl opacity-[0.05] rotate-[-12deg] select-none">📜</div>
      </div>

      {/* Warm radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-warm-gold/8 to-transparent pointer-events-none" 
        style={{ background: 'radial-gradient(circle, hsl(38 72% 50% / 0.08) 0%, transparent 70%)' }}
      />

      <Card className="w-full max-w-md warm-shadow-lg border-warm-gold/20 relative z-10 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-2">
          {/* Decorative ornament */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-warm-gold/40" />
            <div className="relative">
              <BookOpen className="h-10 w-10 text-primary" />
              <Sparkles className="h-4 w-4 text-warm-gold absolute -top-1 -right-2 animate-pulse" />
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-warm-gold/40" />
          </div>
          <CardTitle className="text-3xl font-display tracking-wide">Book Tracker</CardTitle>
          <p className="text-xs text-muted-foreground font-body italic mt-1">Tu rincón de lectura personal</p>
          <CardDescription className="font-body mt-3 text-sm">
            {mode === "login" && "Inicia sesión para acceder a tu biblioteca"}
            {mode === "signup" && "Crea una cuenta para empezar tu aventura"}
            {mode === "forgot" && "Te enviaremos un email para restablecer tu contraseña"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" className="pl-9 bg-warm-paper/50 border-border/60 focus:border-primary/40" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="font-body text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="pl-9 bg-warm-paper/50 border-border/60 focus:border-primary/40" required />
              </div>
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label className="font-body text-sm">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 bg-warm-paper/50 border-border/60 focus:border-primary/40" required minLength={6} />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full font-body bg-primary hover:bg-primary/90 warm-shadow transition-all hover:warm-shadow-lg" disabled={loading}>
              {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Enviar email"}
            </Button>
          </form>

          {/* Ornamental divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-muted-foreground/40 text-xs">✦</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="text-center text-sm font-body space-y-1">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-primary hover:text-primary/80 hover:underline block w-full transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors">Regístrate</button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors">Inicia sesión</button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-primary hover:text-primary/80 hover:underline transition-colors">
                Volver al login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
