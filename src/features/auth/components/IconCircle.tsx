import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";

type IconCircleProps = {
  name: IconName;
  tone: "brand" | "success" | "warning" | "danger";
  // Adds a saffron check on the corner.
  checked?: boolean;
};

const tones = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function IconCircle({ name, tone, checked = false }: IconCircleProps) {
  return (
    <span
      className={`relative flex size-96 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}
    >
      <Icon name={name} size={48} />
      {checked && (
        <span className="absolute -top-4 inset-e-0 flex size-32 items-center justify-center rounded-full bg-saffron text-ink">
          <Icon name="check" size={16} />
        </span>
      )}
    </span>
  );
}
