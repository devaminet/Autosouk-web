import { useRef } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { EmailField } from "../components/EmailField";
import { HeaderAction } from "../components/HeaderAction";
import { textValue } from "../formValues";
import { useRequestPasswordReset } from "../hooks";

const fields = ["email"];

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const form = useRef<HTMLFormElement>(null);
  const requestReset = useRequestPasswordReset();
  useFocusFirstInvalid(form, requestReset.error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestReset.mutate(textValue(new FormData(event.currentTarget), "email"));
  };

  return (
    <AuthShell
      action={
        <HeaderAction
          label={t("forgot.logIn")}
          prompt={t("forgot.remembered")}
          to={paths.login}
        />
      }
    >
      <PageTitle>{t("forgot.pageTitle")}</PageTitle>
      <AuthCard>
        <span className="flex size-control-l items-center justify-center rounded-md bg-paper text-ink">
          <Icon name="key" size={24} />
        </span>
        <AuthHeading description={t("forgot.description")} title={t("forgot.title")} />
        <form
          className="flex flex-col gap-24"
          noValidate
          onSubmit={submit}
          ref={form}
        >
          <output className="block empty:hidden">
            {requestReset.isSuccess && (
              <Alert tone="success">{requestReset.data.message}</Alert>
            )}
          </output>
          <FormErrors error={requestReset.error} fields={fields} />
          <EmailField error={fieldError(requestReset.error, "email")} />
          <Button block isPending={requestReset.isPending} size="l" type="submit" variant="primary">
            {t("forgot.submit")}
            <Icon name="arrow-right" />
          </Button>
        </form>
        <Link
          className="inline-flex items-center justify-center gap-8 rounded-xs type-label-s text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          to={paths.login}
        >
          <Icon name="arrow-left" size={16} />
          {t("forgot.back")}
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
