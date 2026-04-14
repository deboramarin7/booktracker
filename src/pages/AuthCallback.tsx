import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const token_hash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { navigate("/auth", { replace: true }); return; }
        navigate("/biblioteca", { replace: true });
        return;
      }

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
        if (error) { navigate("/auth", { replace: true }); return; }
        navigate("/biblioteca", { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) navigate("/biblioteca", { replace: true });
      else navigate("/auth", { replace: true });
    };

    finishAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020812" }}>
      <div className="fixed inset-0 pointer-events-none">
        <img src="/nebulosa.png" alt="" className="w-full h-full object-cover" style={{ opacity: 0.85 }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <p className="text-white/60 text-sm">Confirmando tu cuenta...</p>
      </div>
    </div>
  );
}
