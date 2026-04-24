import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { SeoBreadcrumbs } from "@/components/SeoBreadcrumbs";
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
    <section className="space-y-6">
      <SeoBreadcrumbs items={breadcrumbs} />
      <div className="grid gap-6 lg:items-start lg:grid-cols-[1.25fr_0.75fr]">
        <div className="glass-card p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            {title}
          </h1>
          <div className="space-y-3 text-sm leading-relaxed text-aether-text-secondary">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {relatedLinks.length > 0 ? (
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fortsæt til</h3>
            <div className="space-y-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {link.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-aether-text-tertiary group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-aether-text-secondary leading-relaxed">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
