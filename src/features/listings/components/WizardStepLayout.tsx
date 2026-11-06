import type { ReactNode } from "react";

type WizardStepLayoutProps = {
  // The cards of the step.
  children: ReactNode;
  // Wide screens only: a side column next to the cards.
  aside?: ReactNode;
  // Wide screens only: a link back to the previous step.
  back?: ReactNode;
  // The main actions. They stick to the bottom of small screens.
  submit: ReactNode;
};

export function WizardStepLayout({ children, aside, back, submit }: WizardStepLayoutProps) {
  return (
    <div className="flex flex-1 flex-col md:grid md:flex-none md:grid-cols-3 md:items-start md:gap-24">
      <div className="flex flex-1 flex-col gap-24 md:col-span-2">{children}</div>
      {aside && <div className="hidden flex-col gap-16 md:flex">{aside}</div>}
      <div className="sticky bottom-0 flex gap-12 border-t border-line bg-surface p-20 md:static md:col-span-2 md:items-center md:justify-between md:gap-16 md:border-0 md:bg-transparent md:p-0">
        <div className="hidden md:block">{back}</div>
        {submit}
      </div>
    </div>
  );
}
