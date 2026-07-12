import { useState } from "react";
import { CloudSun, Info, Menu, RefreshCw, X } from "lucide-react";
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
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand-mark" aria-label="Aarhus Vejr">
          <CloudSun aria-hidden="true" />
          <span>Aarhus Vejr</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primær navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} end={item.end} to={item.href} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="data-status">
          <span>Data via Hugging Face <Info aria-hidden="true" /></span>
          <button onClick={onRefresh} disabled={isRefreshing} aria-label="Genindlæs data">
            {isStale ? "Cache" : "Live"} kl. {updatedText}
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
          </button>
        </div>

        <button className="mobile-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Luk menu" : "Åbn menu"}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {mobileMenuOpen ? (
        <nav className="mobile-nav" aria-label="Mobil navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} end={item.end} to={item.href} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
