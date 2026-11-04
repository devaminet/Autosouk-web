import type { ReactNode } from "react";

type AuthCardProps = {
  wide?: boolean;
  centered?: boolean;
  children: ReactNode;
};

// A card on large screens, and plain page content on mobile, as designed.
export function AuthCard({
  wide = false,
  centered = false,
  children,
}: AuthCardProps) {
  return (
    <div
      className={`flex w-full flex-col gap-24 md:rounded-2xl md:bg-surface md:p-40 md:shadow-elevation-2 ${wide ? "max-w-auth-wide" : "max-w-auth"} ${centered ? "items-center text-center" : ""}`}
    >
      {children}
    </div>
  );
}
