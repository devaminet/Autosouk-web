import { useTranslation } from "react-i18next";
import { Badge } from "../../../../components/Badge";
import { Button } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
import { TextLink } from "../../../../components/TextLink";
import { formatTimeAgo } from "../../../../lib/format";
import { paths } from "../../../../lib/paths";
import type { AuthUser } from "../../api";
import { useDevices, useSetTwoFactor, useSignOutDevice } from "../../hooks";
import { SettingsSection } from "./SettingsSection";

type SignInSecuritySectionProps = {
  id: string;
  user: AuthUser;
};

// Two-step sign-in, and the browsers and phones signed in to the account.
export function SignInSecuritySection({ id, user }: SignInSecuritySectionProps) {
  const { t, i18n } = useTranslation("auth");
  const devices = useDevices();
  const toggle = useSetTwoFactor();
  const signOut = useSignOutDevice();
  const locked = user.twoFactorRequired || !user.phoneVerified;
  const switchId = `${id}-two-factor`;

  return (
    <SettingsSection description={t("account.signIn.description")} id={id} title={t("account.signIn.title")}>
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4">
          <p className="type-label-m text-ink" id={switchId}>
            {t("account.signIn.twoFactor")}
          </p>
          <p className="type-body-s text-muted">
            {user.twoFactorRequired
              ? t("account.signIn.twoFactorRequired")
              : user.phoneVerified
                ? t("account.signIn.twoFactorDescription")
                : t("account.signIn.twoFactorNeedsPhone")}
          </p>
          {!user.phoneVerified && (
            <TextLink size="s" to={paths.verifyPhone}>
              {t("account.signIn.verifyPhone")}
            </TextLink>
          )}
        </div>
        <button
          aria-checked={user.twoFactorEnabled}
          aria-labelledby={switchId}
          className={`relative h-24 w-40 shrink-0 cursor-pointer rounded-full transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${user.twoFactorEnabled ? "bg-success" : "bg-line-strong"}`}
          disabled={locked || toggle.isPending}
          onClick={() => toggle.mutate(!user.twoFactorEnabled)}
          role="switch"
          type="button"
        >
          <span
            className={`absolute top-4 size-16 rounded-full bg-surface shadow-elevation-1 transition-all motion-reduce:transition-none ${user.twoFactorEnabled ? "inset-e-4" : "inset-s-4"}`}
          />
        </button>
      </div>
      <div className="empty:hidden" role="alert">
        {toggle.error && <p className="type-body-xs text-danger">{toggle.error.message}</p>}
      </div>
      <div className="flex flex-col gap-12 border-t border-line pt-20">
        <h3 className="type-label-m text-ink">{t("account.signIn.devices")}</h3>
        {devices.error && <p className="type-body-s text-danger">{devices.error.message}</p>}
        {devices.isPending && <p className="type-body-s text-muted">{t("common:loading")}</p>}
        <ul className="flex flex-col divide-y divide-line">
          {(devices.data ?? []).map((device) => (
            <li className="flex flex-wrap items-center justify-between gap-12 py-12" key={device.id}>
              <div className="flex min-w-0 items-center gap-12">
                <Icon className="shrink-0 text-muted" name={/iOS|Android/u.test(device.label) ? "phone" : "globe"} size={18} />
                <div className="flex min-w-0 flex-col">
                  <p className="type-label-m text-ink" dir="ltr">
                    {device.label}
                  </p>
                  <p className="type-body-xs text-muted">
                    {device.current ? (
                      t("account.signIn.thisDevice")
                    ) : (
                      <>
                        {t("account.signIn.lastActive")} {formatTimeAgo(device.lastSeenAt, i18n.language)}
                      </>
                    )}
                    {device.ipAddress && (
                      <>
                        {" · "}
                        <bdi dir="ltr">{device.ipAddress}</bdi>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {device.current ? (
                <Badge tone="success">{t("account.signIn.current")}</Badge>
              ) : (
                <Button
                  aria-label={t("account.signIn.signOutDevice", { device: device.label })}
                  isPending={signOut.isPending && signOut.variables === device.id}
                  onClick={() => signOut.mutate(device.id)}
                  size="s"
                  variant="danger"
                >
                  {t("account.signIn.signOut")}
                </Button>
              )}
            </li>
          ))}
        </ul>
        <div className="empty:hidden" role="alert">
          {signOut.error && <p className="type-body-xs text-danger">{signOut.error.message}</p>}
        </div>
      </div>
    </SettingsSection>
  );
}
