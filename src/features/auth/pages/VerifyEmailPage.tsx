import { useRef } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { TextLink } from "../../../components/TextLink";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { EmailField } from "../components/EmailField";
import { IconCircle } from "../components/IconCircle";
import { textValue } from "../formValues";
import { useResendVerification } from "../hooks";

const fields = ["email"];

// The API redirects here from the link in the verification email.
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const code = params.get("code");

  if (status === "success" || code === "auth.already_verified") {
    return <VerifiedResult />;
  }
  if (status === "error") {
    return <ResendForm code={code} />;
  }
  return <Navigate replace to={paths.login} />;
}

function VerifiedResult() {
  const { t } = useTranslation("auth");

  return (
    <AuthShell>
      <PageTitle>{t("verified.pageTitle")}</PageTitle>
      <AuthCard centered wide>
        <IconCircle name="check-circle" tone="success" />
        <AuthHeading description={t("verified.description")} title={t("verified.title")} />
        <ButtonLink block size="l" to={paths.login} variant="primary">
          {t("verified.logIn")}
          <Icon name="arrow-right" />
        </ButtonLink>
        <TextLink to={paths.home}>{t("verified.browse")}</TextLink>
      </AuthCard>
    </AuthShell>
  );
}

type ResendFormProps = {
  code: string | null;
};

const linkProblemCodes = ["auth.link_expired", "auth.token_invalid"];

function ResendForm({ code }: ResendFormProps) {
  const { t } = useTranslation(["auth", "errors"]);
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const resend = useResendVerification();
  useFocusFirstInvalid(form, resend.error);

  // Other failures have no designed copy, so show the API catalog's message.
  const description =
    code && !linkProblemCodes.includes(code)
      ? t(`errors:${code}`, { defaultValue: t("expired.description") })
      : t("expired.description");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = textValue(new FormData(event.currentTarget), "email");
    resend.mutate(email, {
      onSuccess: () => {
        void navigate(paths.checkEmail, { state: { email } });
      },
    });
  };

  return (
    <AuthShell>
      <PageTitle>{t("expired.pageTitle")}</PageTitle>
      <AuthCard centered>
        <IconCircle name="clock" tone="warning" />
        <AuthHeading description={description} title={t("expired.title")} />
        <form
          className="flex w-full flex-col gap-16 text-start"
          noValidate
          onSubmit={submit}
          ref={form}
        >
          <FormErrors error={resend.error} fields={fields} />
          <EmailField error={fieldError(resend.error, "email")} />
          <Button block isPending={resend.isPending} size="l" type="submit" variant="primary">
            <Icon name="mail" />
            {t("expired.submit")}
          </Button>
        </form>
        <p className="type-body-s text-muted">
          {t("expired.alreadyVerified")}{" "}
          <TextLink to={paths.login}>{t("expired.logIn")}</TextLink>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
