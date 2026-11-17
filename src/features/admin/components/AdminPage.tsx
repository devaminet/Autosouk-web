import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { TextLink } from "../../../components/TextLink";

type AdminPageProps = {
  title: string;
  description?: string;
  // Buttons or badges beside the title.
  actions?: ReactNode;
  // A link back to the list the page was opened from.
  back?: { to: string; label: string };
  children: ReactNode;
};

// The frame of every admin page: its title, then its content.
export function AdminPage({ title, description, actions, back, children }: AdminPageProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-40 md:py-40">
      <PageTitle>{title}</PageTitle>
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          {back && (
            <TextLink className="inline-flex w-fit items-center gap-4" size="s" to={back.to}>
              <Icon className="rtl:-scale-x-100" name="arrow-left" size={14} />
              {back.label}
            </TextLink>
          )}
          <p className="type-overline text-brand">{t("overline")}</p>
          <h1 className="type-h1 text-ink" dir="auto">
            {title}
          </h1>
          {description && <p className="type-body-m text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-8">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
