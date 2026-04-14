import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import AuthorsSagas from "./pages/AuthorsSagas";
import Wishlist from "./pages/Wishlist";
import Shelves from "./pages/Shelves";
import ReadingHabits from "./pages/ReadingHabits";
import Achievements from "./pages/Achievements";
import Dashboard from "./pages/Dashboard";
import Wrapped from "./pages/Wrapped";
import Help from "./pages/Help";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020812" }}>
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/biblioteca" replace />} />
        <Route path="biblioteca" element={<Library />} />
        <Route path="autores-sagas" element={<AuthorsSagas />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="estanterias" element={<Shelves />} />
        <Route path="reading-habits" element={<ReadingHabits />} />
        <Route path="logros" element={<Achievements />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="wrapped" element={<Wrapped />} />
        <Route path="ayuda" element={<Help />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
