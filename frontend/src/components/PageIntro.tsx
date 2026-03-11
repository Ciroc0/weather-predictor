import { Link } from "react-router-dom";

import { SeoBreadcrumbs } from "@/components/SeoBreadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="space-y-4">
      <SeoBreadcrumbs items={breadcrumbs} />
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-4xl">
              <h1>{title}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </CardContent>
        </Card>

        {relatedLinks.length > 0 ? (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Fortsæt til</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedLinks.map((link) => (
                <div key={link.to} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <Link
                    to={link.to}
                    className="text-base font-medium text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {link.label}
                  </Link>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {link.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
