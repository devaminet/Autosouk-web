export type ButtonVariant =
  | "primary"
  | "dark"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "s" | "m" | "l";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-8 rounded-full text-center no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-on-brand shadow-elevation-brand hover:bg-brand-hover disabled:hover:bg-brand",
  dark: "bg-ink text-surface hover:bg-ink-2 disabled:hover:bg-ink",
  secondary:
    "bg-surface text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2 disabled:hover:bg-surface",
  ghost: "text-ink hover:bg-line disabled:hover:bg-transparent",
  danger: "bg-danger-soft text-danger hover:bg-line",
  success: "bg-success text-on-brand hover:bg-success/90 disabled:hover:bg-success",
};

const sizes: Record<ButtonSize, string> = {
  s: "min-h-control-s px-12 type-label-s",
  m: "min-h-control-m px-16 type-label-m",
  l: "min-h-control-l px-24 type-label-l",
};

type ButtonStyle = {
  variant: ButtonVariant;
  size: ButtonSize;
  block: boolean;
};

export const buttonClasses = ({ variant, size, block }: ButtonStyle): string =>
  `${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""}`;
