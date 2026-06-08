"use client";

import { useEffect, useState } from "react";
import { MoonStar, Sun } from "lucide-react";

const STORAGE_KEY = "theme-preference";
const DEFAULT_THEME = "dark";

type Theme = "light" | "dark";

export function PublicThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme = storedTheme === "light" || storedTheme === "dark" 
      ? storedTheme 
      : DEFAULT_THEME;
    
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  function handleToggle() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="site-icon-button" aria-hidden="true">
        <MoonStar className="h-4 w-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="site-icon-button transition-all duration-300 hover:scale-110 active:scale-95"
      aria-label="Toggle public theme"
      title="Toggle public theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-200 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <MoonStar className="h-4 w-4 text-indigo-900 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}
