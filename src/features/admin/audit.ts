import type { TFunction } from "i18next";
import type { BadgeTone } from "../../components/Badge";
import type { AuditEntry } from "./api";

const knownTargets = ["user", "listing", "identity_verification", "mechanic_document"];

// Removals and refusals in red, approvals in green, views in grey.
export const actionTone = (action: string): BadgeTone => {
  if (/\.(suspended|deleted|rejected)$/u.test(action)) {
    return "danger";
  }
  if (/\.(approved|reactivated)$/u.test(action)) {
    return "success";
  }
  return "neutral";
};

// "Suspended account". An action the client doesn't know shows as sent.
export const actionLabel = (t: TFunction, action: string) => t(`admin:actions.${action}`, { defaultValue: action });

// "User #12", what the entry is about.
export const targetLabel = (t: TFunction, entry: Pick<AuditEntry, "targetType" | "targetId">) =>
  knownTargets.includes(entry.targetType)
    ? t(`admin:targets.${entry.targetType}`, { id: entry.targetId })
    : t("admin:targets.other", { type: entry.targetType, id: entry.targetId });

// The reason an admin gave, when there is one.
export const entryReason = (entry: AuditEntry): string | null => {
  const reason = entry.details?.["reason"];
  return typeof reason === "string" ? reason : null;
};
