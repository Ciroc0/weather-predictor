import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Cloud,
  CloudRain,
  Menu,
  Moon,
  RefreshCw,
  Share2,
  Sun,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { formatDanishDateTime, formatDanishTime } from "@/lib/weather";

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
      text: "Se om ML kan slaa DMI's vejrprognose for Aarhus",
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

  const statusCopy = isStale ? "Viser seneste tilgaengelige snapshot" : "Opdateres direkte fra Hugging Face";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/82 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/82">
      <div className="page-shell flex min-h-[4.5rem] items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-sky-500/20">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-950 dark:text-white">Aarhus Vejr</p>
              <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">{statusCopy}</p>
            </div>
          </Link>
        </div>

        <nav className="hidden min-w-0 items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                end={item.end}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
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
                        className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800"
                        transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
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

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden min-w-[12rem] rounded-full border border-slate-200 bg-slate-50/90 px-3 py-2 text-right dark:border-slate-700 dark:bg-slate-900/70 md:block">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Sidst opdateret
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {lastUpdated ? formatDanishTime(lastUpdated) : "Ingen data"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Skift tema"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Del side"
            onClick={handleShare}
            className="hidden sm:inline-flex"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Opdater data"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden sm:inline-flex"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={mobileMenuOpen ? "Luk menu" : "Aaben menu"}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="page-shell -mt-1 pb-3 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-slate-200/80 bg-slate-50/90 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900/75">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Sidst opdateret
            </p>
            <p className="truncate font-medium text-slate-800 dark:text-slate-100">
              {lastUpdated ? formatDanishDateTime(lastUpdated) : "Ingen data"}
            </p>
          </div>
          <span
            className={[
              "rounded-full px-2.5 py-1 text-xs font-medium",
              isStale
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
            ].join(" ")}
          >
            {isStale ? "Cache" : "Live"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-slate-200/80 bg-white/96 pb-4 pt-3 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/96 lg:hidden"
          >
            <div className="page-shell space-y-3">
              <div className="grid gap-2">
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
                          "flex items-center gap-3 rounded-[1.1rem] border px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "border-slate-300 bg-slate-100 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
                        ].join(" ")
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Hurtige handlinger
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start rounded-xl" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    Del side
                  </Button>
                  <Button variant="outline" className="justify-start rounded-xl" onClick={onRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Opdater
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
