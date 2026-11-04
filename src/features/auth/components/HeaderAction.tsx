import { ButtonLink } from "../../../components/ButtonLink";

type HeaderActionProps = {
  prompt: string;
  label: string;
  to: string;
};

export function HeaderAction({ prompt, label, to }: HeaderActionProps) {
  return (
    <div className="flex items-center gap-8">
      <span className="hidden type-body-s text-muted md:inline">{prompt}</span>
      <ButtonLink size="s" to={to}>
        {label}
      </ButtonLink>
    </div>
  );
}
