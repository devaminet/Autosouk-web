import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { Mechanic } from "../api";
import { useAcceptingRequests } from "../hooks";

type AcceptingRequestsCardProps = {
  mechanic: Mechanic;
};

// Turns the workshop's visibility to buyers on and off, right away.
export function AcceptingRequestsCard({ mechanic }: AcceptingRequestsCardProps) {
  const { t } = useTranslation(["mechanics", "enums"]);
  const toggle = useAcceptingRequests();
  const descriptionId = useId();
  const on = mechanic.isActive;
  const city = t(`enums:city.${mechanic.city.slug}`, { defaultValue: mechanic.city.name });

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-16 rounded-xl bg-night p-20 text-surface md:px-24">
        <span
          className={`flex size-48 shrink-0 items-center justify-center rounded-full ${on ? "bg-success text-on-brand" : "bg-night-2 text-subtle"}`}
        >
          <Icon name="power" size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="type-h4">
            {t(on ? "status.on" : "status.off")}
          </p>
          <p className="type-body-s text-subtle" id={descriptionId}>
            {on ? t("status.onDescription", { city }) : t("status.offDescription")}
          </p>
        </div>
        <label className="flex h-24 w-40 shrink-0 cursor-pointer items-center rounded-full bg-night-2 p-4 ring-1 ring-subtle ring-inset has-checked:bg-success has-checked:ring-success has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-surface has-disabled:cursor-wait">
          <input
            aria-checked={on}
            aria-describedby={descriptionId}
            checked={on}
            className="sr-only"
            disabled={toggle.isPending}
            onChange={(event) => toggle.mutate(event.target.checked)}
            role="switch"
            type="checkbox"
          />
          <span className="sr-only">{t("status.label")}</span>
          <span aria-hidden="true" className={`size-16 rounded-full bg-surface ${on ? "ms-auto" : ""}`} />
        </label>
      </div>
      <div className="empty:hidden" role="alert">
        {toggle.error && <p className="type-body-s text-danger">{toggle.error.message}</p>}
      </div>
    </div>
  );
}
