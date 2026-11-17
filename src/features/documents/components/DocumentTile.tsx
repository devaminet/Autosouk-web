import { useState } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { buttonClasses } from "../../../components/buttonStyles";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { formatDate } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { acceptedTypes, isAcceptedType, maxFileBytes, UploadFailedError } from "../api";
import type { DocumentType, MechanicDocument } from "../api";
import { useRemoveDocument, useUploadDocument } from "../hooks";

type TileState = "empty" | "uploaded" | "pending" | "approved" | "expired" | "rejected";

const looks: Record<TileState, { box: string; icon: string; name: IconName; badge?: BadgeTone }> = {
  empty: { box: "bg-surface-2 ring-line-strong", icon: "bg-brand-soft text-brand", name: "file" },
  uploaded: { box: "bg-surface ring-line", icon: "bg-success-soft text-success", name: "file-check", badge: "success" },
  pending: { box: "bg-surface ring-line", icon: "bg-info-soft text-info", name: "clock", badge: "info" },
  approved: { box: "bg-surface ring-line", icon: "bg-success-soft text-success", name: "check-circle", badge: "success" },
  expired: { box: "bg-surface ring-warning", icon: "bg-warning-soft text-warning", name: "clock", badge: "warning" },
  rejected: { box: "bg-surface ring-danger", icon: "bg-danger-soft text-danger", name: "alert-octagon", badge: "danger" },
};

const stateOf = (document: MechanicDocument | undefined): TileState => {
  if (!document) {
    return "empty";
  }
  if (document.status === "approved" && document.expired) {
    return "expired";
  }
  return document.status;
};

const sizeLabel = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

type DocumentTileProps = {
  type: DocumentType;
  document: MechanicDocument | undefined;
};

// One document the mechanic sends: its state, and a way to upload or replace it.
export function DocumentTile({ type, document }: DocumentTileProps) {
  const { t } = useTranslation(["documents", "enums"]);
  const upload = useUploadDocument();
  const remove = useRemoveDocument();
  const [fileError, setFileError] = useState<string | null>(null);
  const state = stateOf(document);
  const look = looks[state];
  const name = t(`enums:mechanic_document_type.${type}`);
  const locale = getLocale();

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!isAcceptedType(file.type)) {
      setFileError(t("tile.wrongType"));
      return;
    }
    if (file.size > maxFileBytes) {
      setFileError(t("tile.tooLarge"));
      return;
    }
    setFileError(null);
    upload.mutate({ type, file });
  };

  const detail = () => {
    if (upload.isPending) {
      return t("tile.uploading");
    }
    switch (state) {
      case "empty":
        return t("tile.formats");
      case "uploaded":
        return document?.sizeBytes ? t("tile.ready", { size: sizeLabel(document.sizeBytes) }) : t("tile.readyNoSize");
      case "pending":
        return t("tile.inReview");
      case "approved":
        return document?.validUntil
          ? t("tile.validUntil", { date: formatDate(document.validUntil, locale) })
          : t("tile.noExpiry");
      case "expired":
        return document?.validUntil ? t("tile.expiredOn", { date: formatDate(document.validUntil, locale) }) : "";
      case "rejected":
        return document?.rejectionReason ?? "";
    }
  };

  const uploadError =
    fileError ??
    (upload.error instanceof UploadFailedError ? t("tile.failed") : (upload.error?.message ?? null)) ??
    remove.error?.message ??
    null;
  const canUpload = state !== "pending";

  return (
    <li className={`flex flex-col gap-12 rounded-lg p-16 ring-1 ring-inset sm:flex-row sm:items-center ${look.box}`}>
      <div className="flex min-w-0 flex-1 items-center gap-12">
        <span className={`flex size-40 shrink-0 items-center justify-center rounded-md ${look.icon}`}>
          <Icon name={state === "empty" && (type === "cin_front" || type === "cin_back") ? "id-card" : look.name} size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-8">
            <h3 className="type-label-m text-ink">{name}</h3>
            {look.badge && <Badge tone={look.badge}>{t(`tile.states.${state}`)}</Badge>}
          </div>
          <p className={`type-body-xs ${state === "rejected" ? "text-danger" : "text-muted"}`}>{detail()}</p>
        </div>
      </div>
      {canUpload && (
        <div className="flex items-center gap-8 self-start sm:self-auto">
          {state === "uploaded" && (
            <Button
              aria-label={t("tile.removeNamed", { document: name })}
              disabled={upload.isPending}
              isPending={remove.isPending}
              onClick={() => document && remove.mutate(document.id)}
              size="s"
              variant="ghost"
            >
              <Icon name="trash" size={16} />
            </Button>
          )}
          {/* The file input is the control; the label around it looks like a button. */}
          <label
            aria-busy={upload.isPending}
            className={`${buttonClasses({ variant: state === "empty" ? "primary" : "secondary", size: "s", block: false })} has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${upload.isPending ? "pointer-events-none opacity-45" : ""}`}
          >
            {state === "empty" && <Icon name="upload" size={16} />}
            <span aria-hidden="true">{t(state === "empty" ? "tile.upload" : "tile.replace")}</span>
            <input
              accept={acceptedTypes.join(",")}
              aria-label={t(state === "empty" ? "tile.uploadNamed" : "tile.replaceNamed", { document: name })}
              className="sr-only"
              disabled={upload.isPending}
              onChange={pick}
              type="file"
            />
          </label>
        </div>
      )}
      <p className="type-body-xs text-danger empty:hidden sm:basis-full" role="alert">
        {uploadError}
      </p>
    </li>
  );
}
