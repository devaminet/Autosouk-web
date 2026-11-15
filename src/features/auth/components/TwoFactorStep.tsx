import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { OtpInput } from "../../../components/OtpInput";
import { useCountdown } from "../../../hooks/useCountdown";
import { ApiError } from "../../../lib/api/client";
import type { TwoFactorChallenge } from "../api";
import { useCompleteTwoFactor, useResendTwoFactorCode } from "../hooks";
import { AuthHeading } from "./AuthHeading";
import { IconCircle } from "./IconCircle";

const codeLength = 6;
const resendSeconds = 60;

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

type TwoFactorStepProps = {
  challenge: TwoFactorChallenge;
  // Back to the email and password, such as when the sign-in expired.
  onBack: () => void;
};

// The code texted on a sign-in from a new device. The session starts once
// it's right, and the device is remembered.
export function TwoFactorStep({ challenge, onBack }: TwoFactorStepProps) {
  const { t } = useTranslation("auth");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState(challenge.phoneHint);
  const complete = useCompleteTwoFactor();
  const resend = useResendTwoFactorCode();
  const { remaining, startFrom } = useCountdown(resendSeconds);
  const expired = complete.error instanceof ApiError && complete.error.code === "auth.two_factor_expired";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    complete.mutate({ challengeToken: challenge.challengeToken, code });
  };

  const sendAgain = () => {
    complete.reset();
    resend.mutate(challenge.challengeToken, {
      onSuccess: (sent) => {
        setHint(sent.phoneHint);
        setCode("");
        startFrom(resendSeconds);
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-24 text-center">
      <IconCircle name="shield" tone="brand" />
      <AuthHeading
        description={t("login.twoFactor.description", { hint: `⁨${hint}⁩` })}
        title={t("login.twoFactor.title")}
      />
      <form className="flex w-full flex-col items-center gap-20" noValidate onSubmit={submit}>
        <OtpInput
          error={expired ? undefined : complete.error?.message}
          label={t("login.twoFactor.codeLabel")}
          length={codeLength}
          onChange={setCode}
          value={code}
        />
        <Button block disabled={code.length < codeLength || expired} isPending={complete.isPending} size="l" type="submit" variant="primary">
          <Icon name="check" size={18} />
          {t("login.twoFactor.confirm")}
        </Button>
      </form>
      <div className="flex w-full flex-col items-center gap-12">
        {remaining > 0 ? (
          <p className="type-body-s text-muted">
            {t("login.twoFactor.resendIn")} <bdi dir="ltr">{formatTime(remaining)}</bdi>
          </p>
        ) : (
          <Button isPending={resend.isPending} onClick={sendAgain} variant="ghost">
            <Icon name="refresh" size={18} />
            {t("login.twoFactor.resend")}
          </Button>
        )}
        <div className="w-full text-start empty:hidden" role="alert">
          {expired && <Alert tone="warning">{complete.error?.message}</Alert>}
          {resend.error && <Alert tone="danger">{resend.error.message}</Alert>}
        </div>
        <Button onClick={onBack} variant="ghost">
          <Icon className="rtl:-scale-x-100" name="arrow-left" size={18} />
          {t("login.twoFactor.back")}
        </Button>
      </div>
    </div>
  );
}
