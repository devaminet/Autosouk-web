import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { useCountdown } from "../../../hooks/useCountdown";
import { ApiError } from "../../../lib/api/client";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../../auth/components/AuthCard";
import { AuthHeading } from "../../auth/components/AuthHeading";
import { AuthShell } from "../../auth/components/AuthShell";
import { IconCircle } from "../../auth/components/IconCircle";
import { useSession } from "../../auth/hooks";
import { OtpInput } from "../components/OtpInput";
import { StepAction } from "../components/StepAction";
import { useSendPhoneCode, useVerifyPhoneCode } from "../hooks";
import { maskPhone } from "../recording";

const codeLength = 6;

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// The API answers "wait" when a code was sent less than a minute ago, such as
// before a reload. That code still works, so the page counts down instead.
const waitSeconds = (error: unknown): number | null => {
  if (error instanceof ApiError && error.code === "auth.phone_code_wait") {
    const seconds = Number(error.issues[0]?.params?.seconds);
    return Number.isFinite(seconds) ? seconds : null;
  }
  return null;
};

// Step 2 of signing up: a code texted to the phone proves the number is the
// user's. RequireRole makes sure there is a user.
export function VerifyPhonePage() {
  const { t } = useTranslation("identity");
  const navigate = useNavigate();
  const { user } = useSession();
  const { mutate: sendCode, ...send } = useSendPhoneCode();
  const verify = useVerifyPhoneCode();
  const [code, setCode] = useState("");
  const { remaining, startFrom } = useCountdown(0);
  const asked = useRef(false);
  const needsCode = Boolean(user && user.role !== "admin" && !user.phoneVerified);

  const ask = useCallback(() => {
    sendCode(undefined, {
      onSuccess: (sent) => startFrom((Date.parse(sent.resendAt) - Date.now()) / 1000),
      onError: (error) => {
        const seconds = waitSeconds(error);
        if (seconds !== null) {
          startFrom(seconds);
        }
      },
    });
  }, [sendCode, startFrom]);

  // Texts the first code as soon as the page opens, once.
  useEffect(() => {
    if (needsCode && !asked.current) {
      asked.current = true;
      ask();
    }
  }, [needsCode, ask]);

  if (!user) {
    return null;
  }
  if (!needsCode) {
    return <Navigate replace to={user.role === "admin" ? paths.home : paths.verifyIdentity} />;
  }

  const phone = maskPhone(user.phone);
  const sendError = waitSeconds(send.error) === null ? send.error : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verify.mutate(code, { onSuccess: () => void navigate(paths.verifyIdentity) });
  };

  return (
    <AuthShell action={<StepAction step={t("steps.phone")} />}>
      <PageTitle>{t("phone.pageTitle")}</PageTitle>
      <AuthCard centered>
        <IconCircle name="phone" tone="brand" />
        <AuthHeading
          description={t("phone.description", { phone: `⁨${phone}⁩` })}
          title={t("phone.title")}
        />
        <form className="flex w-full flex-col items-center gap-20" noValidate onSubmit={submit}>
          <OtpInput
            error={verify.error?.message}
            label={t("phone.codeLabel", { phone: `⁨${phone}⁩` })}
            length={codeLength}
            onChange={setCode}
            value={code}
          />
          <Button block disabled={code.length < codeLength} isPending={verify.isPending} size="l" type="submit" variant="primary">
            <Icon name="check" size={18} />
            {t("phone.confirm")}
          </Button>
        </form>
        <div className="flex w-full flex-col items-center gap-12">
          {remaining > 0 ? (
            <p className="type-body-s text-muted">
              {t("phone.resendIn")} <bdi dir="ltr">{formatTime(remaining)}</bdi>
            </p>
          ) : (
            <Button isPending={send.isPending} onClick={ask} variant="ghost">
              <Icon name="refresh" size={18} />
              {t("phone.resend")}
            </Button>
          )}
          <div className="w-full text-start empty:hidden" role="alert">
            {sendError && <Alert tone="danger">{sendError.message}</Alert>}
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
