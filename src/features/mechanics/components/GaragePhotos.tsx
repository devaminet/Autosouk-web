import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { maxGaragePhotos } from "../api";
import type { Mechanic } from "../api";
import { useAddGaragePhotos, useRemoveGaragePhoto } from "../hooks";
import { WorkshopSection } from "./WorkshopSection";

type GaragePhotosProps = {
  // Null before the workshop is saved, as photos belong to a saved workshop.
  mechanic: Mechanic | null;
};

// Photos are added and removed right away, apart from the form's save.
export function GaragePhotos({ mechanic }: GaragePhotosProps) {
  const { t } = useTranslation("mechanics");
  const input = useRef<HTMLInputElement>(null);
  const add = useAddGaragePhotos();
  const remove = useRemoveGaragePhoto();
  const photos = mechanic?.garageImages ?? [];
  const full = photos.length >= maxGaragePhotos;
  const error = add.error ?? remove.error;

  return (
    <WorkshopSection
      action={
        mechanic && (
          <>
            <input
              accept=".jpg,.jpeg,.png,.webp"
              aria-label={t("photos.add")}
              className="sr-only"
              multiple
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = "";
                if (files.length > 0) {
                  add.mutate(files);
                }
              }}
              ref={input}
              tabIndex={-1}
              type="file"
            />
            <Button
              disabled={full}
              isPending={add.isPending}
              onClick={() => input.current?.click()}
              size="s"
              variant="dark"
            >
              <Icon name="plus" size={16} />
              {t("photos.add")}
            </Button>
          </>
        )
      }
      description={
        <>
          {t("photos.description")} {t("photos.count", { count: photos.length, max: maxGaragePhotos })}
        </>
      }
      title={t("photos.title")}
    >
      {!mechanic && <p className="type-body-m text-muted">{t("photos.afterSetup")}</p>}
      {mechanic && photos.length === 0 && !add.isPending && (
        <p className="type-body-m text-muted">{t("photos.empty")}</p>
      )}
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-12 sm:grid-cols-3 lg:grid-cols-6">
          {photos.map(({ id, link }, index) => (
            <li className="relative aspect-4/3 overflow-hidden rounded-lg bg-paper" key={id}>
              <img
                alt={t("photos.photo", { number: index + 1 })}
                className="size-full object-cover"
                loading="lazy"
                src={link}
              />
              <button
                aria-label={t("photos.remove", { number: index + 1 })}
                className="absolute end-8 top-8 flex size-32 cursor-pointer items-center justify-center rounded-full bg-surface text-danger shadow-elevation-1 hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait"
                disabled={remove.isPending && remove.variables === id}
                onClick={() => remove.mutate(id)}
                type="button"
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <output className="block type-body-s text-muted empty:hidden">
        {add.isPending && t("photos.uploading", { count: add.variables.length })}
      </output>
      <div className="empty:hidden" role="alert">
        {error && <p className="type-body-s text-danger">{error.message}</p>}
      </div>
    </WorkshopSection>
  );
}
