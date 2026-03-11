import { useEffect } from "react";

import {
  DEFAULT_OG_IMAGE,
  type SeoConfig,
  buildStructuredData,
  getCanonicalUrl,
} from "@/lib/seo";

function ensureMeta(selector: string, attributes: Record<string, string>) {
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    document.head.appendChild(meta);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    meta?.setAttribute(key, value);
  });

  return meta;
}

function ensureLink(selector: string, attributes: Record<string, string>) {
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    document.head.appendChild(link);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    link?.setAttribute(key, value);
  });

  return link;
}

function upsertStructuredData(id: string, json: string | null) {
  const existing = document.head.querySelector<HTMLScriptElement>(`#${id}`);

  if (!json) {
    existing?.remove();
    return;
  }

  const script = existing ?? document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = json;

  if (!existing) {
    document.head.appendChild(script);
  }
}

interface SeoHeadProps {
  config: SeoConfig;
}

export function SeoHead({ config }: SeoHeadProps) {
  useEffect(() => {
    const canonicalUrl = getCanonicalUrl(config.canonicalPath);
    const structuredData = buildStructuredData(config);

    document.title = config.title;
    document.documentElement.lang = "da";

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: config.description,
    });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: "index,follow",
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "website",
    });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Aarhus Vejr",
    });
    ensureMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "da_DK",
    });
    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: config.ogTitle ?? config.title,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: config.ogDescription ?? config.description,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: DEFAULT_OG_IMAGE,
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: config.ogTitle ?? config.title,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: config.ogDescription ?? config.description,
    });
    ensureMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: DEFAULT_OG_IMAGE,
    });

    ensureLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });

    upsertStructuredData(
      "seo-structured-data",
      structuredData.items.length > 0 ? JSON.stringify(structuredData.items) : null,
    );
  }, [config]);

  return null;
}
