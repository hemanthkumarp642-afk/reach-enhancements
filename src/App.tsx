import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/layout/Footer";
import { Briefcase, Menu } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Tasks from "./pages/Tasks";
import Jobs from "./pages/Jobs";
import Revisions from "./pages/Revisions";
import Resumes from "./pages/Resumes";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  if (isAuthPage || location.pathname === "/privacy" || location.pathname === "/terms") {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 md:px-6 md:left-[var(--sidebar-width,0px)]" role="banner">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger aria-label="Toggle navigation menu">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Briefcase className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground hidden sm:inline text-sm md:text-base">JobTrackr</span>
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-x-hidden pt-14" role="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/revisions" element={<Revisions />} />
              <Route path="/resumes" element={<Resumes />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
