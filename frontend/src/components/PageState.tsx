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
      color: "text-[#11c5d6]",
      bg: "bg-[#0c0e11]",
      border: "border-white/[0.1]",
    },
    error: {
      icon: AlertTriangle,
      title: title || "Noget gik galt",
      description: description || "Backend-data kunne ikke læses.",
      color: "text-[#d85b5b]",
      bg: "bg-[#0c0e11]",
      border: "border-white/[0.1]",
    },
    empty: {
      icon: CloudOff,
      title: title || "Ingen data tilgængelige",
      description: description || "Snapshot indeholdt ingen forecast-data.",
      color: "text-[#747d87]",
      bg: "bg-[#0c0e11]",
      border: "border-white/[0.1]",
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
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md ${config.bg} ${config.border} border`}>
            <Icon className={`h-7 w-7 ${config.color} ${mode === 'loading' ? 'animate-spin' : ''}`} />
          </div>
          <h2 className="text-xl font-bold text-white">{config.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#9aa3ad]">{config.description}</p>
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}
