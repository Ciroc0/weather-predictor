import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Menu, X, RefreshCw, Activity } from "lucide-react";
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
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glass morphism nav bar */}
      <div className="mx-4 mt-3 rounded-2xl border border-white/[0.08] bg-[#0f172a]/80 backdrop-blur-2xl shadow-lg shadow-black/20">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08] group-hover:border-cyan-500/30 transition-colors">
              <Cloud className="h-4 w-4 text-cyan-400" />
              <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Aarhus <span className="text-gradient-cyan">Vejr</span>
            </span>
          </Link>

          {/* Desktop Navigation - Pill Style */}
          <nav className="hidden items-center gap-1 rounded-xl bg-white/[0.04] p-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                end={item.end}
                to={item.href}
                className={({ isActive }) =>
                  isActive
                    ? "rounded-lg bg-white/[0.12] px-4 py-1.5 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                    : "rounded-lg px-4 py-1.5 text-sm font-medium text-aether-text-secondary transition-all duration-200 hover:text-white hover:bg-white/[0.06]"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden text-right lg:block mr-2">
              <div className="flex items-center justify-end gap-1.5">
                <Activity className={`h-3 w-3 ${isStale ? 'text-amber-400' : 'text-emerald-400'}`} />
                <p className="text-[11px] font-medium text-aether-text-tertiary uppercase tracking-wider">
                  {isStale ? 'Cache' : 'Live'}
                </p>
              </div>
              <p className="text-xs font-medium text-aether-text-secondary">{updatedText}</p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-aether-text-secondary hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
              aria-label="Genindlæs data"
              title="Genindlæs data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-aether-text-secondary hover:text-white hover:bg-white/[0.08] transition-all md:hidden"
              aria-label={mobileMenuOpen ? "Luk menu" : "Åbn menu"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mt-2 rounded-2xl border border-white/[0.08] bg-[#0f172a]/95 backdrop-blur-2xl shadow-xl md:hidden overflow-hidden"
          >
            <div className="space-y-1 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  end={item.end}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "block rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-white/[0.12] text-white"
                        : "text-aether-text-secondary hover:text-white hover:bg-white/[0.06]",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
