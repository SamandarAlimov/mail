import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("alsamos-theme") as Theme) || "dark";
    }
    return "dark";
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from profile when user is authenticated
  useEffect(() => {
    const loadThemeFromProfile = async () => {
      if (!user) {
        setIsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data?.preferences) {
          const prefs = data.preferences as { theme?: Theme };
          if (prefs.theme) {
            setTheme(prefs.theme);
            localStorage.setItem("alsamos-theme", prefs.theme);
          }
        }
      } catch (err) {
        console.error("Failed to load theme from profile:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemeFromProfile();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (resolvedTheme: "dark" | "light") => {
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    };

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      applyTheme(systemTheme);
      
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setThemeWithPersist = useCallback(async (newTheme: Theme) => {
    localStorage.setItem("alsamos-theme", newTheme);
    setTheme(newTheme);

    // Sync to profile if user is authenticated
    if (user) {
      try {
        // First get current preferences
        const { data } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        const currentPrefs = (data?.preferences as Record<string, unknown>) || {};
        
        await supabase
          .from("profiles")
          .update({
            preferences: { ...currentPrefs, theme: newTheme }
          })
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to sync theme to profile:", err);
      }
    }
  }, [user]);

  return { theme, setTheme: setThemeWithPersist, isLoaded };
}
