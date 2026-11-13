import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import type { AuthUser } from "../../auth/api";
import { isFullyVerified } from "../api";

type Tone = "action" | "pending" | "rejected";

const looks: Record<Tone, { box: string; icon: string; name: IconName }> = {
  action: { box: "bg-brand-soft", icon: "text-brand", name: "scan-face" },
  pending: { box: "bg-info-soft", icon: "text-info", name: "clock" },
  rejected: { box: "bg-danger-soft", icon: "text-danger", name: "alert-octagon" },
};

const toneOf = (user: AuthUser): Tone => {
  if (!user.phoneVerified || user.identityStatus === "not_submitted") {
    return "action";
  }
  return user.identityStatus === "pending" ? "pending" : "rejected";
};

type VerificationBannerProps = {
  user: AuthUser;
};

// Tells signed-in users who haven't passed the phone and face checks what's
// left, until they're verified.
export function VerificationBanner({ user }: VerificationBannerProps) {
  const { t } = useTranslation("identity");

  if (isFullyVerified(user)) {
    return null;
  }
  const tone = toneOf(user);
  const look = looks[tone];
  const target = user.phoneVerified ? paths.verifyIdentity : paths.verifyPhone;

  return (
    <aside
      aria-label={t(`banner.${tone}Title`)}
      className={`mx-20 mt-16 flex flex-col gap-12 rounded-lg p-16 sm:flex-row sm:items-center md:mx-auto md:w-full md:max-w-dialog ${look.box}`}
    >
      <span className="flex size-40 shrink-0 items-center justify-center rounded-full bg-surface">
        <Icon className={look.icon} name={look.name} size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="type-label-m text-ink">{t(`banner.${tone}Title`)}</p>
        <p className="type-body-s text-ink-2">{t(`banner.${tone}Description`)}</p>
      </div>
      {tone !== "pending" && (
        <ButtonLink className="self-start sm:self-auto" size="s" to={target} variant={tone === "rejected" ? "dark" : "primary"}>
          {t(tone === "rejected" ? "banner.tryAgain" : "banner.start")}
        </ButtonLink>
      )}
    </aside>
  );
}
