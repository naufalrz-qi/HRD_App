"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/** Script disisipkan di <head> agar tema diterapkan sebelum hidrasi (anti-flash). */
export const themeInitScript = `(function(){try{var d=localStorage.getItem('darkMode')==='true';if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

const EVENT = "arunika:themechange";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}
function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("darkMode", String(next));
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <button onClick={toggle} className={`inline-flex items-center gap-2 ${className}`} title="Ganti Tema" type="button">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      <span>Tema</span>
    </button>
  );
}
