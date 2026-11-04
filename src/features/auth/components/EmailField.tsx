import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "../../../components/TextField";

type EmailFieldProps = Omit<
  ComponentProps<typeof TextField>,
  "label" | "icon" | "type" | "name"
>;

export function EmailField(props: EmailFieldProps) {
  const { t } = useTranslation("auth");
  return (
    <TextField
      autoComplete="email"
      dir="auto"
      icon="mail"
      label={t("fields.email")}
      name="email"
      type="email"
      {...props}
    />
  );
}
