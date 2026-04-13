"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "@/app/providers";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="button button-secondary" style={{ width: "100%" }} onClick={toggleTheme} type="button" aria-label="Toggle theme">
      {theme === "dark" ? <SunMedium size={18} /> : <Moon size={18} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
