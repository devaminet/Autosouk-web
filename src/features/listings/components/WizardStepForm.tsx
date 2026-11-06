import type { ComponentProps, FormEvent, Ref } from "react";
import { WizardStepLayout } from "./WizardStepLayout";

type WizardStepFormProps = {
  id?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  ref?: Ref<HTMLFormElement>;
} & ComponentProps<typeof WizardStepLayout>;

// A step whose main button saves a form.
export function WizardStepForm({ id, onSubmit, ref, ...layout }: WizardStepFormProps) {
  return (
    <form className="flex flex-1 flex-col" id={id} noValidate onSubmit={onSubmit} ref={ref}>
      <WizardStepLayout {...layout} />
    </form>
  );
}
