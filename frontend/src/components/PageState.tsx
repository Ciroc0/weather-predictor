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
      title: title || "Indlæser dashboard",
      description: description || "Live forecast, verifikation og modelmetadata hentes nu.",
    },
    error: {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: title || "Noget gik galt",
      description: description || "Backend-data kunne ikke læses.",
    },
    empty: {
      icon: <CloudOff className="h-8 w-8" />,
      title: title || "Ingen data tilgængelige",
      description: description || "Snapshot indeholdt ingen forecast-data.",
    },
  }[mode];

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {config.icon}
        </div>
        <h2 className="text-xl font-semibold">{config.title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{config.description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
