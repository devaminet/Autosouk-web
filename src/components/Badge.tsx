import type { ReactNode } from "react";

const tones = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-line text-ink-2",
  dark: "bg-ink text-surface",
};

export type BadgeTone = keyof typeof tones;

type BadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-4 rounded-full px-8 py-4 type-label-s ${tones[tone]}`}
    >
      <span aria-hidden="true" className="size-4 rounded-full bg-current" />
      {children}
    </span>
  );
}
