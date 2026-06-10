"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync with whatever the no-flash script set on <html>.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="btn px-2 py-2"
      title={dark ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
