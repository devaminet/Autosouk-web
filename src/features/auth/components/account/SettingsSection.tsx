import type { ReactNode } from "react";

type SettingsSectionProps = {
  // The anchor the account page's navigation links to.
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
};

// One card of the account page.
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex scroll-mt-24 flex-col gap-24 rounded-xl border border-line bg-surface p-20 md:p-32"
      id={id}
    >
      <div className="flex flex-col gap-4">
        <h2 className="type-h4 text-ink" id={titleId}>
          {title}
        </h2>
        {description && <p className="type-body-s text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
