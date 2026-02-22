import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      applyTheme(savedTheme || "light");
      return;
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("theme")
      .eq("user_id", user.id)
      .single();

    const userTheme = settings?.theme as "light" | "dark" | null;
    applyTheme(userTheme || "light");
  };

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    setTheme(newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_settings")
        .update({ theme: newTheme })
        .eq("user_id", user.id);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 hover:bg-accent/10 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-foreground" />
      ) : (
        <Sun className="h-5 w-5 text-foreground" />
      )}
    </button>
  );
}
