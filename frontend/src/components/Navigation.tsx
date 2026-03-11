import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Cloud, CloudRain, Menu, Moon, RefreshCw, Share2, Sun, Thermometer, Wind, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { formatDanishTime } from "@/lib/weather";

interface NavigationProps {
  lastUpdated: string | null;
  onRefresh: () => void | Promise<void>;
  isRefreshing: boolean;
  isStale: boolean;
}

const navItems = [
  { href: "/", label: "Oversigt", icon: Cloud, end: true },
  { href: "/temperatur", label: "Temperatur", icon: Thermometer },
  { href: "/vind", label: "Vind", icon: Wind },
  { href: "/regn", label: "Regn", icon: CloudRain },
  { href: "/performance", label: "Performance", icon: BarChart3 },
];

export function Navigation({ lastUpdated, onRefresh, isRefreshing, isStale }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const handleShare = async () => {
    const sharePayload = {
      title: "Aarhus Vejr",
      text: "Se om ML kan slå DMI's vejrprognose for Aarhus",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard.writeText(sharePayload.url);
  };

  const updatedText = lastUpdated ? formatDanishTime(lastUpdated) : "Ingen data";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-semibold text-slate-950 dark:text-white">Aarhus Vejr</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isStale ? "Forbindelse til Hugging Face" : "Direkte fra Hugging Face"}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                end={item.end}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "relative rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-slate-950 dark:text-white"
                      : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.span
                        layoutId="desktop-nav"
                        className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-slate-800"
                        transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
                      />
                    ) : null}
                    <span className="relative flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right lg:block">
            <p className="text-xs text-slate-500 dark:text-slate-400">Sidst opdateret</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{updatedText}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="hidden sm:inline-flex">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing} className="hidden sm:inline-flex">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen((value) => !value)} className="md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden"
          >
            <div className="space-y-2 px-4 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    end={item.end}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                        isActive
                          ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                          : "text-slate-600 dark:text-slate-400",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Del
                </Button>
                <Button variant="outline" className="flex-1" onClick={onRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Opdater
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
