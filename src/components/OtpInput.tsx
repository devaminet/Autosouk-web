import { useId, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

type OtpInputProps = {
  // The digits typed so far, up to `length`.
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  hint?: string;
  length?: number;
};

const digitsOnly = (text: string) => text.replace(/\D/gu, "");

// One box per digit. Typing moves to the next box, Backspace to the previous
// one, and pasting a whole code fills every box.
export function OtpInput({ value, onChange, label, error, hint, length = 6 }: OtpInputProps) {
  const { t } = useTranslation();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const errorId = useId();
  const hintId = useId();
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");
  const positions = Array.from({ length }, (_, index) => index + 1);

  const focus = (index: number) => boxes.current[Math.max(0, Math.min(index, length - 1))]?.focus();

  const set = (index: number, typed: string) => {
    const incoming = digitsOnly(typed);
    if (incoming.length === 0) {
      return;
    }
    const next = (value.slice(0, index) + incoming).slice(0, length);
    onChange(next);
    focus(next.length);
  };

  const keyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      // Clears this box, or the previous one when this one is empty.
      const target = digits[index] ? index : index - 1;
      if (target >= 0) {
        onChange(value.slice(0, target));
        focus(target);
      }
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      // The code reads left to right in every language.
      event.preventDefault();
      focus(index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = digitsOnly(event.clipboardData.getData("text")).slice(0, length);
    if (pasted) {
      onChange(pasted);
      focus(pasted.length);
    }
  };

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset aria-describedby={describedBy} className="flex flex-col gap-8">
      <legend className="pb-8 type-label-m text-ink">{label}</legend>
      <div className="flex gap-8" dir="ltr">
        {positions.map((position) => {
          const index = position - 1;
          const digit = digits[index] ?? "";
          return (
          <input
            aria-invalid={Boolean(error)}
            aria-label={t("otp.digit", { position, total: length })}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className={`h-control-l w-48 rounded-md border bg-surface text-center type-h3 text-ink focus:border-brand focus:shadow-focus focus:outline-none ${error ? "border-danger" : "border-line-strong"}`}
            inputMode="numeric"
            key={position}
            maxLength={length}
            onChange={(event) => set(index, event.target.value.replace(digit, ""))}
            onFocus={(event) => event.target.select()}
            onKeyDown={(event) => keyDown(index, event)}
            onPaste={paste}
            ref={(element) => {
              boxes.current[index] = element;
            }}
            type="text"
            value={digit}
          />
          );
        })}
      </div>
      {error && (
        <p className="type-body-xs text-danger" id={errorId}>
          {error}
        </p>
      )}
      {hint && (
        <p className="type-body-xs text-muted" id={hintId}>
          {hint}
        </p>
      )}
    </fieldset>
  );
}
