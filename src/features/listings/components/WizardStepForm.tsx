import type { FormEvent, ReactNode, Ref } from "react";

type WizardStepFormProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  ref?: Ref<HTMLFormElement>;
  // The cards of the step.
  children: ReactNode;
  // Wide screens only: a side column next to the cards.
  aside?: ReactNode;
  // Wide screens only: a link back to the previous step.
  back?: ReactNode;
  // The main button. It sticks to the bottom of small screens.
  submit: ReactNode;
};

export function WizardStepForm({ onSubmit, ref, children, aside, back, submit }: WizardStepFormProps) {
  return (
    <form
      className="flex flex-1 flex-col md:grid md:flex-none md:grid-cols-3 md:items-start md:gap-24"
      noValidate
      onSubmit={onSubmit}
      ref={ref}
    >
      <div className="flex flex-1 flex-col gap-24 md:col-span-2">{children}</div>
      {aside && <div className="hidden flex-col gap-16 md:flex">{aside}</div>}
      <div className="sticky bottom-0 border-t border-line bg-surface p-20 md:static md:col-span-2 md:flex md:items-center md:justify-between md:gap-16 md:border-0 md:bg-transparent md:p-0">
        <div className="hidden md:block">{back}</div>
        {submit}
      </div>
    </form>
  );
}
