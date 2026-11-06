import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { maxMediaCount, minImageCount } from "../media";

// The API's media rules for a published listing, in words.
export function MediaRules() {
  const { t } = useTranslation("listings");
  const rules: { icon: IconName; text: string }[] = [
    { icon: "image", text: t("media.rules.minPhotos", { count: minImageCount }) },
    { icon: "star", text: t("media.rules.cover") },
    { icon: "hash", text: t("media.rules.limit", { count: maxMediaCount }) },
    { icon: "shield", text: t("media.rules.confirmed") },
  ];

  return (
    <section className="flex flex-col gap-16 rounded-xl border border-line bg-surface p-20">
      <h2 className="type-h5 text-ink">{t("media.rules.title")}</h2>
      <ul className="flex flex-col gap-12">
        {rules.map(({ icon, text }) => (
          <li className="flex items-start gap-12 type-body-s text-ink-2" key={icon}>
            <Icon className="mt-2 text-brand" name={icon} size={16} />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
