import type { ReactNode } from "react";

type BadgeProps = {
  tone: "brand" | "success";
  children: ReactNode;
};

const tones = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
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
