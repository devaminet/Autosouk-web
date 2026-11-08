import { useId } from "react";
import type { ReactNode } from "react";

type WorkshopSectionProps = {
  title: string;
  description?: ReactNode;
  // A button beside the title, such as "Use my location".
  action?: ReactNode;
  children: ReactNode;
};

// One card of the workshop profile.
export function WorkshopSection({ title, description, action, children }: WorkshopSectionProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-24 rounded-xl border border-line bg-surface p-20 md:p-32"
    >
      <div className="flex flex-wrap items-start justify-between gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 className="type-h3 text-ink" id={titleId}>
            {title}
          </h2>
          {description && <p className="type-body-s text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
