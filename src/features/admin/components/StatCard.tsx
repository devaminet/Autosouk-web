import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";

const noteTones = {
  muted: "text-muted",
  warning: "text-warning",
  danger: "text-danger",
};

type StatCardProps = {
  label: string;
  value: number;
  icon: IconName;
  note?: string;
  noteTone?: keyof typeof noteTones;
};

// One figure of the dashboard, with what it means below.
export function StatCard({ label, value, icon, note, noteTone = "muted" }: StatCardProps) {
  return (
    <div className="flex flex-col gap-12 rounded-xl bg-surface p-20 ring-1 ring-line ring-inset">
      <div className="flex items-center justify-between gap-8">
        <p className="type-body-s text-muted">{label}</p>
        <span aria-hidden="true" className="flex size-32 items-center justify-center rounded-full bg-paper text-ink-2">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="type-display-m text-ink">
        <bdi dir="ltr">{formatNumber(value)}</bdi>
      </p>
      {note && <p className={`type-label-s ${noteTones[noteTone]}`}>{note}</p>}
    </div>
  );
}
