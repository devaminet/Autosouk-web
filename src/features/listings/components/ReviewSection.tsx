import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";

type ReviewSectionProps = {
  title: string;
  // The step that changes this part.
  editTo: string;
  children: ReactNode;
};

export function ReviewSection({ title, editTo, children }: ReviewSectionProps) {
  const { t } = useTranslation("listings");

  return (
    <section className="flex flex-col gap-12 border-t border-line pt-24">
      <div className="flex items-center justify-between gap-12">
        <h2 className="type-h4 text-ink">{title}</h2>
        <ButtonLink aria-label={t("review.editSection", { section: title })} size="s" to={editTo}>
          <Icon name="pencil" size={14} />
          {t("review.edit")}
        </ButtonLink>
      </div>
      {children}
    </section>
  );
}
