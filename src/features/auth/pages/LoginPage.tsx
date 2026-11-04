import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { PageTitle } from "../../../components/PageTitle";
import { TextField } from "../../../components/TextField";
import { TextLink } from "../../../components/TextLink";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../components/AuthCard";
import { AuthHeading } from "../components/AuthHeading";
import { AuthShell } from "../components/AuthShell";
import { EmailField } from "../components/EmailField";
import { HeaderAction } from "../components/HeaderAction";
import { MobileBrandHero } from "../components/MobileBrandHero";
import { rawValue } from "../formValues";
import { useLogin, useResendVerification } from "../hooks";

const fields = ["email", "password"];

const noticeSchema = z.object({ notice: z.string() });

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const form = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const login = useLogin();
  const resend = useResendVerification();
  const notice = noticeSchema.safeParse(location.state);

  const error = login.error ?? resend.error;
  useFocusFirstInvalid(form, error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resend.reset();
    login.mutate({
      email: email.trim(),
      password: rawValue(new FormData(event.currentTarget), "password"),
    });
  };

  const resendLink = () => {
    login.reset();
    const address = email.trim();
    resend.mutate(address, {
      onSuccess: () => {
        void navigate(paths.checkEmail, { state: { email: address } });
      },
    });
  };

  return (
    <AuthShell
      action={
        <HeaderAction
          label={t("login.createAccount")}
          prompt={t("login.newHere")}
          to={paths.register}
        />
      }
      hideHeaderOnMobile
    >
      <PageTitle>{t("login.pageTitle")}</PageTitle>
      <AuthCard>
        <MobileBrandHero />
        <AuthHeading title={t("login.title")} description={t("login.description")} />
        <output className="block empty:hidden">
          {notice.success && <Alert tone="success">{notice.data.notice}</Alert>}
        </output>
        <form
          className="flex flex-col gap-24"
          noValidate
          onSubmit={submit}
          ref={form}
        >
          <FormErrors error={error} fields={fields} />
          <EmailField
            error={fieldError(error, "email")}
            onChange={(event) => setEmail(event.target.value)}
            value={email}
          />
          <div className="flex flex-col items-end gap-8">
            <TextField
              autoComplete="current-password"
              dir="auto"
              error={fieldError(error, "password")}
              fieldClassName="self-stretch"
              icon="lock"
              label={t("fields.password")}
              name="password"
              type="password"
            />
            <TextLink size="s" to={paths.forgotPassword}>
              {t("login.forgotPassword")}
            </TextLink>
          </div>
          <Button block isPending={login.isPending} size="l" type="submit" variant="primary">
            {t("login.submit")}
          </Button>
          <Alert
            action={
              <button
                className="cursor-pointer rounded-xs type-label-s text-warning underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed"
                disabled={resend.isPending}
                onClick={resendLink}
                type="button"
              >
                {t("login.resend")}
              </button>
            }
            title={t("login.notVerifiedTitle")}
            tone="warning"
          >
            {t("login.notVerifiedDescription")}
          </Alert>
          <p className="text-center type-body-s text-muted md:hidden">
            {t("login.newHereMobile")}{" "}
            <TextLink to={paths.register}>{t("login.createAccountMobile")}</TextLink>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
