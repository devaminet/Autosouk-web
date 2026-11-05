import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { PageTitle } from "../../../components/PageTitle";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { paths } from "../../../lib/paths";
import { ListingWizardShell } from "../components/ListingWizardShell";
import { WizardTips } from "../components/WizardTips";
import { useCreateListing } from "../hooks";

const fields = ["title", "description"];

export function NewListingPage() {
  const { t } = useTranslation("listings");
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateListing();
  useFocusFirstInvalid(form, create.error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.mutate(
      { title, description },
      {
        onSuccess: () => {
          void navigate(paths.myListings, {
            state: { notice: t("newListing.saved") },
          });
        },
      },
    );
  };

  return (
    <ListingWizardShell step="listing">
      <PageTitle>{t("wizard.title")}</PageTitle>
      <form
        className="flex flex-1 flex-col md:grid md:flex-none md:grid-cols-3 md:items-start md:gap-24"
        noValidate
        onSubmit={submit}
        ref={form}
      >
        <div className="flex flex-1 flex-col gap-24 px-20 pb-24 md:col-span-2 md:rounded-xl md:border md:border-line md:bg-surface md:p-32">
          <header className="flex flex-col gap-4">
            <h1 className="type-h1 text-ink md:type-h2">{t("newListing.title")}</h1>
            <p className="type-body-m text-muted">{t("newListing.description")}</p>
          </header>
          <FormErrors error={create.error} fields={fields} />
          <TextField
            dir="auto"
            error={fieldError(create.error, "title")}
            label={t("newListing.titleLabel")}
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
          <TextAreaField
            dir="auto"
            error={fieldError(create.error, "description")}
            label={t("newListing.descriptionLabel")}
            name="description"
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            value={description}
          />
        </div>
        <div className="hidden md:block">
          <WizardTips tips={[t("newListing.tips.title"), t("newListing.tips.description")]} />
        </div>
        <div className="sticky bottom-0 border-t border-line bg-surface p-20 md:static md:col-span-2 md:flex md:justify-end md:border-0 md:bg-transparent md:p-0">
          <Button
            block
            className="md:w-auto"
            isPending={create.isPending}
            size="l"
            type="submit"
            variant="primary"
          >
            {t("newListing.submit")}
          </Button>
        </div>
      </form>
    </ListingWizardShell>
  );
}
