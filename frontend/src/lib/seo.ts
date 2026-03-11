export const SITE_URL = "https://www.vqpon.dk";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
  breadcrumbs?: BreadcrumbItem[];
  faqItems?: FaqItem[];
  includeWebsiteSchema?: boolean;
}

export interface StructuredDataConfig {
  items: Array<Record<string, unknown>>;
}

function toCanonicalUrl(path: string) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export const homeSeo: SeoConfig = {
  title: "Aarhus Vejr | ML vs DMI vejrudsigt for Aarhus",
  description:
    "Følg vejret i Aarhus med live sammenligning mellem DMI og vores ML-model for temperatur, vind, regn og modelpræcision.",
  canonicalPath: "/",
  ogTitle: "Aarhus Vejr | ML vs DMI vejrudsigt for Aarhus",
  ogDescription:
    "Sammenlign DMI og ML for temperatur, vind, regn og modelpræcision i Aarhus.",
  breadcrumbs: [{ name: "Forside", path: "/" }],
  includeWebsiteSchema: true,
};

export const temperatureFaqItems: FaqItem[] = [
  {
    question: "Hvad viser temperatursiden for Aarhus?",
    answer:
      "Siden viser den næste temperaturprognose for Aarhus samt en historisk backtest, hvor DMI og ML sammenlignes med de målte temperaturer.",
  },
  {
    question: "Hvornår bruges ML i stedet for DMI?",
    answer:
      "Når der er en aktiv temperaturmodel, vises den ML-justerede prognose som det primære bud. Hvis modellen ikke er aktiv, vises DMI direkte.",
  },
  {
    question: "Hvorfor sammenlignes der med historiske målinger?",
    answer:
      "Historikken gør det muligt at se, om ML faktisk har ramt tættere på det målte vejr i Aarhus end DMI har gjort.",
  },
];

export const temperatureSeo: SeoConfig = {
  title: "Temperatur i Aarhus | ML vs DMI temperaturprognose",
  description:
    "Se temperaturprognosen for Aarhus og sammenlign DMI med vores ML-model på både forecast og historisk præcision.",
  canonicalPath: "/temperatur",
  breadcrumbs: [
    { name: "Forside", path: "/" },
    { name: "Temperatur", path: "/temperatur" },
  ],
  faqItems: temperatureFaqItems,
};

export const windFaqItems: FaqItem[] = [
  {
    question: "Hvad er forskellen på vindhastighed og vindstød?",
    answer:
      "Vindhastighed er den mere stabile middelvind, mens vindstød er de kortvarige toppe, som ofte er det mest mærkbare i Aarhus.",
  },
  {
    question: "Hvorfor er vind vigtigt at måle lokalt i Aarhus?",
    answer:
      "Aarhus påvirkes af kyst, havn og bymiljø, som kan gøre lokale vindforhold mere komplekse end en generel landsprognose antyder.",
  },
  {
    question: "Hvornår bruger siden ML for vind?",
    answer:
      "Når der findes en aktiv model for vind eller vindstød, bruges ML som primær kilde. Ellers vises DMI som direkte baseline.",
  },
];

export const windSeo: SeoConfig = {
  title: "Vind i Aarhus | ML vs DMI vindprognose og vindstød",
  description:
    "Få overblik over vind, vindstød og vindretning i Aarhus med sammenligning mellem DMI og vores ML-model.",
  canonicalPath: "/vind",
  breadcrumbs: [
    { name: "Forside", path: "/" },
    { name: "Vind", path: "/vind" },
  ],
  faqItems: windFaqItems,
};

export const rainFaqItems: FaqItem[] = [
  {
    question: "Hvad er forskellen på regnrisiko og regnmængde?",
    answer:
      "Regnrisiko siger noget om sandsynligheden for nedbør, mens regnmængde siger noget om hvor meget der forventes at falde i millimeter.",
  },
  {
    question: "Hvordan finder siden tørre perioder?",
    answer:
      "Siden markerer perioder med lav regnrisiko over flere sammenhængende timer, så du hurtigt kan spotte de mest sandsynligt tørre vinduer.",
  },
  {
    question: "Kan ML vise noget andet end DMI ved regn i Aarhus?",
    answer:
      "Ja, hvis regnmodellerne er aktive, kan ML justere både sandsynligheden for regn og den forventede nedbørsmængde i Aarhus.",
  },
];

export const rainSeo: SeoConfig = {
  title: "Regn i Aarhus | ML vs DMI regnrisiko og regnmængde",
  description:
    "Se regnrisiko og regnmængde for Aarhus, og sammenlign DMI med vores ML-model for nedbør og tørre perioder.",
  canonicalPath: "/regn",
  breadcrumbs: [
    { name: "Forside", path: "/" },
    { name: "Regn", path: "/regn" },
  ],
  faqItems: rainFaqItems,
};

export const performanceFaqItems: FaqItem[] = [
  {
    question: "Hvad betyder det, at ML slår DMI?",
    answer:
      "Det betyder kun, at ML i den målte evalueringsperiode lå tættere på det faktiske vejr end DMI gjorde på de sammenlignede punkter.",
  },
  {
    question: "Hvad er RMSE og MAE?",
    answer:
      "RMSE og MAE er fejlmål. Jo lavere tal, jo tættere lå prognosen på det målte vejr i Aarhus.",
  },
  {
    question: "Er en bedre model altid bedre i næste døgn?",
    answer:
      "Nej. Performance-siden viser historisk præcision og ikke en garanti for, at ML altid vil være bedst på det næste forecast.",
  },
];

export const performanceSeo: SeoConfig = {
  title: "Hvor præcis er vejrudsigten i Aarhus? | ML vs DMI",
  description:
    "Se hvor præcist vores ML-model har ramt i Aarhus sammenlignet med DMI, inklusive RMSE, MAE, win rate og fejlanalyse.",
  canonicalPath: "/performance",
  breadcrumbs: [
    { name: "Forside", path: "/" },
    { name: "Performance", path: "/performance" },
  ],
  faqItems: performanceFaqItems,
};

export function getCanonicalUrl(path: string) {
  return toCanonicalUrl(path);
}

export function buildStructuredData(config: SeoConfig): StructuredDataConfig {
  const items: Array<Record<string, unknown>> = [];

  if (config.includeWebsiteSchema) {
    items.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Aarhus Vejr",
      url: SITE_URL,
      inLanguage: "da-DK",
      description: config.description,
    });
  }

  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    items.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: config.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: toCanonicalUrl(item.path),
      })),
    });
  }

  if (config.faqItems && config.faqItems.length > 0) {
    items.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: config.faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return { items };
}
