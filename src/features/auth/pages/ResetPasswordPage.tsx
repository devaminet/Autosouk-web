import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { FormErrors } from "../../../components/FormErrors";
import { PageTitle } from "../../../components/PageTitle";
import { TextField } from "../../../components/TextField";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { PasswordStrength } from "../components/PasswordStrength";
import { rawValue } from "../formValues";
import { useSetNewPassword } from "../hooks";

const fields = ["password"];

// The API checks the token, then redirects here from the link in the email.
export function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const form = useRef<HTMLFormElement>(null);
  const setNewPassword = useSetNewPassword();
  const [password, setPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  useFocusFirstInvalid(form, setNewPassword.error ?? mismatch);

  if (!token) {
    return (
      <AuthShell>
        <PageTitle>{t("reset.pageTitle")}</PageTitle>
        <AuthCard>
          <AuthHeading title={t("reset.invalidTitle")} />
          <Alert tone="warning">{t("reset.invalidDescription")}</Alert>
          <ButtonLink block size="l" to={paths.forgotPassword} variant="primary">
            {t("reset.requestNew")}
          </ButtonLink>
        </AuthCard>
      </AuthShell>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The API takes one password, so only the client can compare the two.
    if (rawValue(new FormData(event.currentTarget), "confirmPassword") !== password) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setNewPassword.mutate(
      { token, password },
      {
        onSuccess: ({ message }) => {
          void navigate(paths.login, { state: { notice: message } });
        },
      },
    );
  };

  return (
    <AuthShell>
      <PageTitle>{t("reset.pageTitle")}</PageTitle>
      <AuthCard>
        <div className="flex flex-col gap-8">
          <Badge tone="success">{t("reset.linkVerified")}</Badge>
          <AuthHeading description={t("reset.description")} title={t("reset.title")} />
        </div>
        <form
          className="flex flex-col gap-24"
          noValidate
          onSubmit={submit}
          ref={form}
        >
          <FormErrors error={setNewPassword.error} fields={fields} />
          <div className="flex flex-col gap-8">
            <TextField
              autoComplete="new-password"
              dir="auto"
              error={fieldError(setNewPassword.error, "password")}
              icon="lock"
              label={t("fields.newPassword")}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            <PasswordStrength password={password} />
          </div>
          <TextField
            autoComplete="new-password"
            dir="auto"
            error={mismatch ? t("reset.mismatch") : undefined}
            icon="lock"
            label={t("fields.confirmPassword")}
            name="confirmPassword"
            type="password"
          />
          <Button block isPending={setNewPassword.isPending} size="l" type="submit" variant="primary">
            {t("reset.submit")}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
