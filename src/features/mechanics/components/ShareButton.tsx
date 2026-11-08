import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";

type ShareButtonProps = {
  title: string;
};

// Opens the device's share sheet, or copies the page's address where there is none.
export function ShareButton({ title }: ShareButtonProps) {
  const { t } = useTranslation("mechanics");
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      // Closing the share sheet rejects, which is not an error.
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
  };

  return (
    <>
      <button
        aria-label={t("profile.share")}
        className="flex size-control-m shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={() => void share()}
        onBlur={() => setCopied(false)}
        type="button"
      >
        <Icon name="share" size={18} />
      </button>
      <output className="type-body-xs text-success empty:hidden">{copied ? t("profile.linkCopied") : null}</output>
    </>
  );
}
