import { initialsOf } from "../workshopForm";

type GarageAvatarProps = {
  name: string;
  logo: string | null;
  size: "m" | "l";
  // Saffron marks the best rated garage, as on the podium.
  isTop?: boolean;
};

const sizes = {
  m: "size-40 type-label-m",
  l: "size-48 type-h5",
} as const;

// The garage's logo, or its initials. The name always sits next to it.
export function GarageAvatar({ name, logo, size, isTop = false }: GarageAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${isTop ? "bg-saffron text-ink" : "bg-brand-soft text-brand-ink"} ${sizes[size]}`}
      dir="auto"
    >
      {logo ? <img alt="" className="size-full object-cover" src={logo} /> : initialsOf(name)}
    </span>
  );
}
