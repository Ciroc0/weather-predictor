import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/seo";

interface FaqSectionProps {
  title?: string;
  items: FaqItem[];
}

export function FaqSection({ title = "Ofte stillede spørgsmål", items }: FaqSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{title}</h3>
      <Accordion type="single" collapsible className="space-y-2">
        {items.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`faq-${index}`}
            className="border border-white/[0.06] rounded-xl px-4 data-[state=open]:border-white/[0.12] transition-colors"
          >
            <AccordionTrigger className="text-sm font-medium text-white hover:no-underline py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-aether-text-secondary leading-relaxed pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
