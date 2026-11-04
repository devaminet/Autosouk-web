import { Link } from "react-router";
import type { LinkProps } from "react-router";

type TextLinkProps = {
  size?: "s" | "m";
} & LinkProps;

export function TextLink({
  size = "m",
  className = "",
  ...props
}: TextLinkProps) {
  const type = size === "s" ? "type-label-s" : "type-label-m";
  return (
    <Link
      className={`${type} rounded-xs text-brand underline hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      {...props}
    />
  );
}
