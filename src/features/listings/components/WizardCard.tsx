import type { ReactNode } from "react";

type WizardCardProps = {
  title: string;
  description: string;
  // Shown beside the title, such as a count.
  badge?: ReactNode;
  // The first card's title is the page heading.
  headingLevel: 1 | 2;
  children: ReactNode;
};

export function WizardCard({ title, description, badge, headingLevel, children }: WizardCardProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className="flex flex-col gap-24 px-20 pb-24 md:rounded-xl md:border md:border-line md:bg-surface md:p-32">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-12">
          <Heading className="type-h1 text-ink md:type-h2">{title}</Heading>
          {badge}
        </div>
        <p className="type-body-m text-muted">{description}</p>
      </header>
      {children}
    </section>
  );
}
