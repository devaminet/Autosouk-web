import { Link } from "react-router";
import type { LinkProps } from "react-router";
import { buttonClasses } from "./buttonStyles";
import type { ButtonSize, ButtonVariant } from "./buttonStyles";

type ButtonLinkProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
} & LinkProps;

// Looks like a button and navigates like a link.
export function ButtonLink({
  variant = "secondary",
  size = "m",
  block = false,
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${buttonClasses({ variant, size, block })} ${className}`}
      {...props}
    />
  );
}
