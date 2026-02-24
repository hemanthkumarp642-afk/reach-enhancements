import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/layout/Footer";
import { Briefcase, ChevronRight, PanelLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
      </Routes>);

  }

  return (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>);

}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/jobs": "Job Tracker",
  "/tasks": "Tasks",
  "/revisions": "Revisions",
  "/resumes": "Resumes",
  "/settings": "Settings"
};

function AppLayout() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const pageTitle = ROUTE_TITLES[location.pathname] || "JobTrackr";

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <AppSidebar />
      <div
        className="flex-1 flex flex-col min-w-0 w-full transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          marginLeft: isMobile ? 0 : isCollapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)'
        }}>

        <header
          className="fixed top-0 left-0 right-0 z-50 h-12 items-center justify-between border-b border-border bg-background px-3 sm:px-4 transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] my-0 flex flex-row"
          style={{
            paddingLeft: isMobile ? undefined : isCollapsed ? 'calc(var(--sidebar-width-icon) + 0.5rem)' : 'calc(var(--sidebar-width) + 0.5rem)'
          }}
          role="banner">

          <div className="flex items-center gap-1.5">
            <SidebarTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors" aria-label="Toggle sidebar">
              <PanelLeft className="h-[18px] w-[18px] text-muted-foreground" />
            </SidebarTrigger>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Briefcase className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{pageTitle}</span>
            </div>
          </div>
          <ThemeToggle />
        </header>
        <div className="h-12" /> {/* Spacer for fixed header */}
        <main className="flex-1 overflow-x-hidden" role="main">
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
    </div>);

}

const App = () =>
<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;


export default App;