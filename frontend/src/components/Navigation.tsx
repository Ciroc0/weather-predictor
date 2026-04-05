import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Menu, X, Clock, Settings } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
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

export function Navigation({ lastUpdated }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const updatedText = lastUpdated ? formatDanishTime(lastUpdated) : "Ingen data";

  return (
    <header className="sticky top-0 z-50 border-b border-dashboard-border bg-[#1e222d]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-dashboard-text" />
          <span className="text-lg font-semibold tracking-wide text-dashboard-text">Aarhus Vejr</span>
        </Link>

        {/* Desktop Navigation - Pill Style */}
        <nav className="hidden items-center gap-1 rounded-lg bg-[#2b303d] p-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              end={item.end}
              to={item.href}
              className={({ isActive }) =>
                isActive
                  ? "rounded-md bg-[#3f4759] px-4 py-1.5 text-sm font-medium text-white transition-all"
                  : "rounded-md px-4 py-1.5 text-sm font-medium text-dashboard-text-muted transition-all hover:text-white"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden text-right lg:block">
            <p className="text-xs text-dashboard-text-muted">Sidst opdateret</p>
            <p className="text-sm font-medium text-dashboard-text">{updatedText}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-dashboard-text-muted hover:text-white"
            aria-label="Historie"
            title="Historie"
          >
            <Clock className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-dashboard-text-muted hover:text-white"
            aria-label="Indstillinger"
            title="Indstillinger"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="text-dashboard-text-muted hover:text-white md:hidden"
            aria-label={mobileMenuOpen ? "Luk menu" : "Åbn menu"}
            title={mobileMenuOpen ? "Luk menu" : "Åbn menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-dashboard-border bg-[#1e222d] md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  end={item.end}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "block rounded-lg px-4 py-3 text-sm font-medium",
                      isActive
                        ? "bg-[#3f4759] text-white"
                        : "text-dashboard-text-muted hover:text-white",
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
