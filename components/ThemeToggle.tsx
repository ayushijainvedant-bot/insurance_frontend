"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Light/dark theme toggle. The initial `dark` class is applied pre-paint by the
 * inline script in the root layout; this button reads that state, then flips the
 * class on <html> and persists the choice to localStorage.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the theme class applied pre-paint. */
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* ignore */ }
  }

  // When a className is passed it fully replaces the default skin, so callers on
  // a dark bar can restyle without fighting the base colours.
  const skin = className || "border-line bg-white text-ink hover:border-brand/40 hover:text-brand";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${skin}`}
    >
      {/* Render a stable icon until mounted to avoid a hydration mismatch. */}
      {ready && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
