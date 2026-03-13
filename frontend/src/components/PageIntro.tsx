import { Link } from "react-router-dom";

import { SeoBreadcrumbs } from "@/components/SeoBreadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import type { BreadcrumbItem } from "@/lib/seo";

interface RelatedLink {
  to: string;
  label: string;
  description: string;
}

interface PageIntroProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  paragraphs: string[];
  relatedLinks?: RelatedLink[];
}

export function PageIntro({
  breadcrumbs = [],
  title,
  paragraphs,
  relatedLinks = [],
}: PageIntroProps) {
  return (
    <section className="section-stack">
      <SeoBreadcrumbs items={breadcrumbs} />

      <Card className="panel-card border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 py-0 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)] lg:gap-8 lg:p-8">
          <div className="min-w-0 space-y-4">
            <p className="section-eyebrow">Aarhus vejr forklaret enkelt</p>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-[2.6rem]">
                {title}
              </h1>
              <div className="copy-measure space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-[0.96rem]">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          {relatedLinks.length > 0 ? (
            <div className="soft-surface h-full p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Fortsaet herfra
              </p>
              <div className="mt-4 grid gap-3">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-[1.1rem] border border-slate-200 bg-white/95 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/85 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{link.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{link.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
