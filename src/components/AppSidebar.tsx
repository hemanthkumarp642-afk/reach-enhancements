import { LayoutDashboard, CheckSquare, Briefcase, BookOpen, FileText, Settings, LogOut, Bell } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useReminders } from "@/hooks/useReminders";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem } from
"@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Job Tracker", href: "/jobs", icon: Briefcase },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Revisions", href: "/revisions", icon: BookOpen },
  { name: "Resumes", href: "/resumes", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dueCount } = useReminders();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    }
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/auth");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <nav aria-label="Main navigation">
          <SidebarMenu className="space-y-0.5">
            {navigation.map((item) =>
            <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <NavLink
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ?
                  "bg-primary/10 text-primary font-semibold border-l-2 border-primary group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:border-b-2" :
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`
                  }>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                    {item.name === "Dashboard" && dueCount > 0 &&
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                        {dueCount > 9 ? "9+" : dueCount}
                      </span>
                  }
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2.5">
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
              {getInitials(profile?.full_name || null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs font-medium truncate">{profile?.full_name || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          aria-label="Sign out">
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>
          </span>
        </button>
      </SidebarFooter>
    </Sidebar>);
}
