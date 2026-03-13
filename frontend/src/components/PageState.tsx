import type { ReactNode } from "react";
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
      icon: <LoaderCircle className="h-8 w-8 animate-spin" />,
      title: title || "Indlaeser dashboard",
      description: description || "Live forecast, verifikation og modelmetadata hentes nu.",
      tone: "from-sky-50 to-emerald-50 dark:from-slate-900 dark:to-slate-950",
    },
    error: {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: title || "Noget gik galt",
      description: description || "Backend-data kunne ikke laeses.",
      tone: "from-rose-50 to-amber-50 dark:from-slate-900 dark:to-rose-950/20",
    },
    empty: {
      icon: <CloudOff className="h-8 w-8" />,
      title: title || "Ingen data tilgaengelige",
      description: description || "Snapshot indeholdt ingen forecast-data.",
      tone: "from-slate-50 to-sky-50 dark:from-slate-900 dark:to-slate-950",
    },
  }[mode];

  return (
    <div className="flex min-h-[50vh] items-center justify-center py-8">
      <div
        className={[
          "w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-gradient-to-br p-8 text-center shadow-sm dark:border-slate-800",
          config.tone,
        ].join(" ")}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white/90 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100">
          {config.icon}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{config.title}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{config.description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
