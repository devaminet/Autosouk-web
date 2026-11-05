import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import type { NewListingInput } from "../api";
import { WizardCard } from "./WizardCard";
import { WizardStepForm } from "./WizardStepForm";
import { WizardTips } from "./WizardTips";

const fields = ["title", "description"];

type ListingTextFormProps = {
  initial?: NewListingInput;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: NewListingInput) => void;
};

// The first step: the title and description buyers read.
export function ListingTextForm({ initial, isPending, error, onSubmit }: ListingTextFormProps) {
  const { t } = useTranslation("listings");
  const form = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  useFocusFirstInvalid(form, error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ title, description });
  };

  return (
    <WizardStepForm
      aside={<WizardTips tips={[t("newListing.tips.title"), t("newListing.tips.description")]} />}
      onSubmit={submit}
      ref={form}
      submit={
        <Button block className="md:w-auto" isPending={isPending} size="l" type="submit" variant="primary">
          {t("newListing.submit")}
          <Icon name="arrow-right" size={18} />
        </Button>
      }
    >
      <WizardCard description={t("newListing.description")} headingLevel={1} title={t("newListing.title")}>
        <FormErrors error={error} fields={fields} />
        <TextField
          dir="auto"
          error={fieldError(error, "title")}
          label={t("newListing.titleLabel")}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <TextAreaField
          dir="auto"
          error={fieldError(error, "description")}
          label={t("newListing.descriptionLabel")}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          value={description}
        />
      </WizardCard>
    </WizardStepForm>
  );
}
