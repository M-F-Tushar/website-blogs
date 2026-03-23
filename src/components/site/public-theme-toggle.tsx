"use client";

import { useEffect, useState } from "react";
import { MoonStar } from "lucide-react";

const STORAGE_KEY = "public-theme-mode";
const DEFAULT_THEME = "midnight";

type PublicTheme = "midnight" | "eclipse";

function applyTheme(theme: PublicTheme) {
  document.documentElement.dataset.publicTheme = theme;
}

export function PublicThemeToggle() {
  const [theme, setTheme] = useState<PublicTheme>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_THEME;
    }

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "midnight" || storedTheme === "eclipse"
      ? storedTheme
      : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function handleToggle() {
    const nextTheme = theme === "midnight" ? "eclipse" : "midnight";
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="site-icon-button"
      aria-label="Toggle public theme"
      title="Toggle public theme"
    >
      <MoonStar className="h-4 w-4" />
    </button>
  );
}
