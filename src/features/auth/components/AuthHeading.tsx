import type { ReactNode } from "react";

type AuthHeadingProps = {
  title: string;
  description?: ReactNode;
};

export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="type-h1 text-ink">{title}</h1>
      {description && <p className="type-body-m text-muted">{description}</p>}
    </div>
  );
}
