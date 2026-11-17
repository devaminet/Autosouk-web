import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { MechanicDocument } from "../api";
import { useDocumentLink } from "../hooks";

type DocumentViewerProps = {
  document: MechanicDocument | null;
};

// Shows the document the admin opened. Each opening asks the API for a link,
// which it logs.
export function DocumentViewer({ document }: DocumentViewerProps) {
  const { t } = useTranslation(["documents", "enums"]);
  const link = useDocumentLink(document?.id ?? null);
  const name = document ? t(`enums:mechanic_document_type.${document.type}`) : "";

  const stage = () => {
    if (!document) {
      return <p className="type-body-s text-subtle">{t("admin.viewer.pick")}</p>;
    }
    if (link.isError) {
      return (
        <p className="type-body-s text-surface" role="alert">
          {link.error.message}
        </p>
      );
    }
    if (!link.data) {
      return <output className="type-body-s text-subtle">{t("common:loading")}</output>;
    }
    return link.data.contentType.startsWith("image/") ? (
      <img alt={name} className="max-h-full max-w-full rounded-xs object-contain" src={link.data.url} />
    ) : (
      <iframe className="size-full rounded-xs bg-surface" src={link.data.url} title={name} />
    );
  };

  return (
    <section aria-label={t("admin.viewer.label")} className="flex flex-col gap-12 rounded-xl bg-night-2 p-16">
      <div className="flex flex-wrap items-center gap-8">
        <p className="min-w-0 flex-1 type-label-m text-surface">{name || t("admin.viewer.label")}</p>
        <span className="inline-flex items-center gap-4 rounded-sm bg-night px-8 py-4 type-body-xs text-subtle">
          <Icon name="eye" size={14} />
          {t("admin.viewer.logged")}
        </span>
        {link.data && (
          <a
            className="inline-flex items-center gap-4 rounded-sm bg-night px-8 py-4 type-body-xs text-surface focus-visible:outline-2 focus-visible:outline-brand"
            href={link.data.url}
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="share" size={14} />
            {t("admin.viewer.newTab")}
          </a>
        )}
      </div>
      <div className="flex h-camera items-center justify-center overflow-hidden">{stage()}</div>
    </section>
  );
}
