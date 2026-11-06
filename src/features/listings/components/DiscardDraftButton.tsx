import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import { useDeleteListing } from "../hooks";
import { DeleteListingDialog } from "./DeleteListingDialog";

type DiscardDraftButtonProps = {
  draft: { id: number; title: string };
};

// Discarding a saved draft deletes it, so it asks first.
export function DiscardDraftButton({ draft }: DiscardDraftButtonProps) {
  const { t } = useTranslation("listings");
  const navigate = useNavigate();
  const deletion = useDeleteListing();
  const [isAsking, setIsAsking] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          deletion.reset();
          setIsAsking(true);
        }}
      >
        <Icon name="x" size={16} />
        {t("wizard.discard")}
      </Button>
      <DeleteListingDialog
        error={deletion.error?.message ?? null}
        isPending={deletion.isPending}
        listing={isAsking ? draft : null}
        onClose={() => setIsAsking(false)}
        onConfirm={() =>
          deletion.mutate(draft.id, {
            onSuccess: () => {
              void navigate(paths.myListings, {
                state: { notice: t("myListings.deleted", { title: draft.title }) },
              });
            },
          })
        }
      />
    </>
  );
}
