import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import Layout from "./components/Layout";
import Library from "./pages/Library";
import AuthorsSagas from "./pages/AuthorsSagas";
import Dashboard from "./pages/Dashboard";
import WishList from "./pages/WishList";
import ReadingHabits from "./pages/ReadingHabits";
import Achievements from "./pages/Achievements";
import Wrapped from "./pages/Wrapped";
import Shelves from "./pages/Shelves";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Library />} />
              <Route path="/autores-sagas" element={<AuthorsSagas />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/wishlist" element={<WishList />} />
              <Route path="/reading-habits" element={<ReadingHabits />} />
              <Route path="/logros" element={<Achievements />} />
              <Route path="/wrapped" element={<Wrapped />} />
              <Route path="/estanterias" element={<Shelves />} />
            </Route>
            <Route path="/ayuda" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
