import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { useCountdown } from "../../../hooks/useCountdown";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { HeaderAction } from "../components/HeaderAction";
import { IconCircle } from "../components/IconCircle";
import { useResendVerification } from "../hooks";
import { mailApp } from "../mailApp";

const resendCooldownSeconds = 60;

const stateSchema = z.object({
  email: z.string(),
  photoFailed: z.boolean().optional(),
});

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function CheckEmailPage() {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const resend = useResendVerification();
  const { remaining, restart } = useCountdown(resendCooldownSeconds);
  const state = stateSchema.safeParse(location.state);

  // The page only means something right after asking for a verification email.
  if (!state.success) {
    return <Navigate replace to={paths.login} />;
  }

  const { email, photoFailed } = state.data;
  const app = mailApp(email);

  return (
    <AuthShell
      action={
        <HeaderAction
          label={t("checkEmail.useAnotherEmail")}
          prompt={t("checkEmail.wrongAddress")}
          to={paths.register}
        />
      }
    >
      <PageTitle>{t("checkEmail.pageTitle")}</PageTitle>
      <AuthCard centered>
        <IconCircle checked name="mail" tone="brand" />
        <AuthHeading
          description={
            <>
              {t("checkEmail.descriptionBefore")} <bdi>{email}</bdi>.{" "}
              {t("checkEmail.descriptionAfter")}
            </>
          }
          title={t("checkEmail.title")}
        />
        <div className="grid w-full grid-cols-1 gap-12 sm:grid-cols-2">
          <a
            className="inline-flex min-h-control-m items-center justify-center gap-8 rounded-full bg-ink px-16 type-label-m text-surface hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href={app.href}
          >
            <Icon name="mail" size={18} />
            {t(app.labelKey)}
          </a>
          <Button
            block
            disabled={remaining > 0}
            isPending={resend.isPending}
            onClick={() => resend.mutate(email, { onSuccess: restart })}
          >
            <Icon name="refresh" size={18} />
            {remaining > 0 ? (
              <>
                {t("checkEmail.resendIn")}{" "}
                <bdi dir="ltr">{formatTime(remaining)}</bdi>
              </>
            ) : (
              t("checkEmail.resend")
            )}
          </Button>
        </div>
        <div className="flex w-full flex-col gap-12 text-start">
          <output className="block empty:hidden">
            {resend.isSuccess && <Alert tone="success">{resend.data.message}</Alert>}
          </output>
          <FormErrors error={resend.error} fields={[]} />
          {photoFailed && <Alert tone="warning">{t("checkEmail.photoFailed")}</Alert>}
          <Alert title={t("checkEmail.nextTitle")} tone="success">
            {t("checkEmail.nextDescription")}
          </Alert>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
