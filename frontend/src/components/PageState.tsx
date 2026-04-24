import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CloudOff, LoaderCircle } from "lucide-react";

interface PageStateProps {
  mode: "loading" | "error" | "empty";
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function PageState({ mode, title, description, action }: PageStateProps) {
  const config = {
    loading: {
      icon: LoaderCircle,
      title: title || "Indlæser dashboard",
      description: description || "Live forecast, verifikation og modelmetadata hentes nu.",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/20",
      glow: "shadow-cyan-400/20",
    },
    error: {
      icon: AlertTriangle,
      title: title || "Noget gik galt",
      description: description || "Backend-data kunne ikke læses.",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20",
      glow: "shadow-rose-400/20",
    },
    empty: {
      icon: CloudOff,
      title: title || "Ingen data tilgængelige",
      description: description || "Snapshot indeholdt ingen forecast-data.",
      color: "text-aether-text-tertiary",
      bg: "bg-white/[0.04]",
      border: "border-white/[0.08]",
      glow: "shadow-black/20",
    },
  }[mode];

  const Icon = config.icon;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <div className="glass-card p-8 text-center">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${config.bg} ${config.border} border ${config.glow} shadow-lg`}>
            <Icon className={`h-7 w-7 ${config.color} ${mode === 'loading' ? 'animate-spin' : ''}`} />
          </div>
          <h2 className="text-xl font-bold text-white">{config.title}</h2>
          <p className="mt-2 text-sm text-aether-text-secondary leading-relaxed">{config.description}</p>
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}
