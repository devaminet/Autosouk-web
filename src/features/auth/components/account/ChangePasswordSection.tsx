import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../../components/Alert";
import { Button } from "../../../../components/Button";
import { FormErrors } from "../../../../components/FormErrors";
import { TextField } from "../../../../components/TextField";
import { useFocusFirstInvalid } from "../../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../../lib/api/errors";
import type { AuthUser } from "../../api";
import { rawValue } from "../../formValues";
import { useChangePassword, useRequestPasswordReset } from "../../hooks";
import { PasswordStrength } from "../PasswordStrength";
import { SettingsSection } from "./SettingsSection";

const fields = ["oldPassword", "password", "confirmPassword"];

type ChangePasswordSectionProps = {
  id: string;
  user: AuthUser;
};

export function ChangePasswordSection({ id, user }: ChangePasswordSectionProps) {
  const { t } = useTranslation("auth");
  const form = useRef<HTMLFormElement>(null);
  const change = useChangePassword();
  const resetLink = useRequestPasswordReset();
  const [password, setPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  useFocusFirstInvalid(form, change.error ?? mismatch);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.currentTarget;
    const values = new FormData(target);
    const confirmPassword = rawValue(values, "confirmPassword");
    if (confirmPassword !== password) {
      setMismatch(true);
      change.reset();
      return;
    }
    setMismatch(false);
    change.mutate(
      { email: user.email, oldPassword: rawValue(values, "oldPassword"), password, confirmPassword },
      {
        onSuccess: () => {
          target.reset();
          setPassword("");
        },
      },
    );
  };

  return (
    <SettingsSection description={t("account.password.description")} id={id} title={t("account.password.title")}>
      <form className="flex flex-col gap-24" noValidate onSubmit={submit} ref={form}>
        <FormErrors error={change.error} fields={fields} />
        <div aria-live="polite" className="empty:hidden">
          {change.isSuccess && <Alert tone="success">{change.data.message}</Alert>}
        </div>
        <div className="grid gap-24 md:grid-cols-2 md:items-start">
          <TextField
            autoComplete="current-password"
            dir="auto"
            error={fieldError(change.error, "oldPassword")}
            icon="lock"
            label={t("account.password.current")}
            name="oldPassword"
            type="password"
          />
          <div className="flex flex-col gap-8">
            <TextField
              autoComplete="new-password"
              dir="auto"
              error={fieldError(change.error, "password")}
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
            error={mismatch ? t("reset.mismatch") : fieldError(change.error, "confirmPassword")}
            fieldClassName="md:col-start-2"
            icon="lock"
            label={t("fields.confirmPassword")}
            name="confirmPassword"
            type="password"
          />
        </div>
        <div className="flex flex-col-reverse gap-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-8">
            <p className="flex flex-wrap items-center gap-4 type-body-s text-muted">
              {t("account.password.forgot")}
              <button
                aria-busy={resetLink.isPending}
                className="cursor-pointer rounded-xs type-label-m text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed"
                disabled={resetLink.isPending}
                onClick={() => resetLink.mutate(user.email)}
                type="button"
              >
                {t("account.password.sendLink")}
              </button>
            </p>
            <div aria-live="polite" className="empty:hidden">
              {resetLink.isSuccess && <Alert tone="success">{resetLink.data.message}</Alert>}
              {resetLink.isError && <Alert tone="danger">{resetLink.error.message}</Alert>}
            </div>
          </div>
          <Button className="self-start sm:self-auto" isPending={change.isPending} type="submit" variant="primary">
            {t("account.password.submit")}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
