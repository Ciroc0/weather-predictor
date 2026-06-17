import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cloud, Menu, RefreshCw, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { formatDanishTime } from "@/lib/weather";

interface NavigationProps {
  lastUpdated: string | null;
  onRefresh: () => void | Promise<void>;
  isRefreshing: boolean;
  isStale: boolean;
}

const navItems = [
  { href: "/", label: "Oversigt", end: true },
  { href: "/temperatur", label: "Temperatur" },
  { href: "/vind", label: "Vind" },
  { href: "/regn", label: "Regn" },
  { href: "/performance", label: "Performance" },
];

export function Navigation({ lastUpdated, onRefresh, isRefreshing, isStale }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const updatedText = lastUpdated ? formatDanishTime(lastUpdated) : "Ingen data";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#08090b]/95">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#101216]">
            <Cloud className="h-4 w-4 text-[#11c5d6]" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">Aarhus Vejr</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              end={item.end}
              to={item.href}
              className={({ isActive }) => (isActive ? "nav-pill-active" : "nav-pill-inactive")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#68717b]">
              {isStale ? "Cache" : "Live"} / {updatedText}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.1] bg-[#101216] text-[#9aa3ad] transition-colors hover:text-white disabled:opacity-50"
            aria-label="Genindlaes data"
            title="Genindlaes data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.1] bg-[#101216] text-[#9aa3ad] transition-colors hover:text-white md:hidden"
            aria-label={mobileMenuOpen ? "Luk menu" : "Aabn menu"}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.nav
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="border-t border-white/[0.08] bg-[#08090b] px-4 py-3 md:hidden"
          >
            <div className="mx-auto grid max-w-[1360px] gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  end={item.end}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "rounded-md px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-[#14181d] text-white" : "text-[#9aa3ad] hover:bg-[#11151a] hover:text-white",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
