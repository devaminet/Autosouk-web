import type { ComponentProps } from "react";
import { buttonClasses } from "./buttonStyles";
import type { ButtonSize, ButtonVariant } from "./buttonStyles";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  isPending?: boolean;
} & ComponentProps<"button">;

export function Button({
  variant = "secondary",
  size = "m",
  block = false,
  isPending = false,
  type = "button",
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={isPending}
      className={`${buttonClasses({ variant, size, block })} ${className}`}
      disabled={disabled || isPending}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
