import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

type AlertTone = "success" | "warning" | "danger" | "info";

const tones: Record<AlertTone, { box: string; icon: string; name: IconName }> =
  {
    success: {
      box: "bg-success-soft",
      icon: "text-success",
      name: "check-circle",
    },
    warning: { box: "bg-warning-soft", icon: "text-warning", name: "info" },
    danger: {
      box: "bg-danger-soft",
      icon: "text-danger",
      name: "alert-triangle",
    },
    info: { box: "bg-info-soft", icon: "text-info", name: "info" },
  };

type AlertProps = {
  tone: AlertTone;
  title?: string;
  action?: ReactNode;
  children?: ReactNode;
};

// Purely visual. Announce changes with a live region around it.
export function Alert({ tone, title, action, children }: AlertProps) {
  const { box, icon, name } = tones[tone];

  return (
    <div className={`flex items-start gap-12 rounded-md p-12 ${box}`}>
      <Icon className={icon} name={name} size={18} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {title && <p className="type-label-s text-ink">{title}</p>}
        {children && <div className="type-body-xs text-ink-2">{children}</div>}
      </div>
      {action}
    </div>
  );
}
