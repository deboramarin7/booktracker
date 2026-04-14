import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, BookOpen } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("¡Revisa tu email para confirmar tu cuenta!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#020812" }}>
      <div className="fixed inset-0 pointer-events-none">
        <img src="/nebulosa.png" alt="" className="w-full h-full object-cover" style={{ opacity: 0.85 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="text-emerald-400" size={28} />
            <span className="text-white font-bold text-xl">Book Tracker</span>
          </div>
          <p className="text-white/50 text-sm">Tu diario lector</p>
        </div>

        <div className="rounded-3xl border border-white/10 p-6"
          style={{ background: "rgba(5,10,20,0.75)", backdropFilter: "blur(20px)" }}>
          <h2 className="text-white font-bold text-lg mb-6 text-center">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-emerald-500/50 transition-colors"
                style={{ background: "rgba(255,255,255,0.06)" }}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1 block">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-emerald-500/50 transition-colors"
                style={{ background: "rgba(255,255,255,0.06)" }}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            {message && <p className="text-emerald-400 text-xs text-center">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {loading ? "..." : isLogin ? "Entrar" : "Registrarme"}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-4">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
              className="text-emerald-400 hover:text-emerald-300 transition-colors">
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
