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
          <div className="space-y-3 text-sm leading-relaxed text-[#9aa3ad]">
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
                  className="group block rounded-md border border-white/[0.08] bg-[#0c0e11] p-4 transition-colors hover:border-white/[0.16] hover:bg-[#11151a]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white transition-colors group-hover:text-[#11c5d6]">
                      {link.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#747d87] transition-colors group-hover:text-[#11c5d6]" />
                  </div>
                  <p className="text-xs leading-relaxed text-[#9aa3ad]">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
