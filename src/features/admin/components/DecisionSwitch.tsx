type DecisionSwitchProps = {
  name: string;
  value: "approved" | "rejected" | null;
  onChange: (value: "approved" | "rejected") => void;
  approveLabel: string;
  rejectLabel: string;
};

// Approve or reject, as two radio buttons that look like a switch.
export function DecisionSwitch({ name, value, onChange, approveLabel, rejectLabel }: DecisionSwitchProps) {
  return (
    <div className="flex w-fit gap-4 rounded-full bg-paper p-4">
      {(["approved", "rejected"] as const).map((option) => (
        // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text is nested deeper than the rule checks.
        <label
          className={`cursor-pointer rounded-full px-16 py-8 type-label-s has-focus-visible:outline-2 has-focus-visible:outline-brand ${value === option ? (option === "approved" ? "bg-success text-on-brand" : "bg-danger text-on-brand") : "text-ink-2"}`}
          key={option}
        >
          <input checked={value === option} className="sr-only" name={name} onChange={() => onChange(option)} type="radio" />
          {option === "approved" ? approveLabel : rejectLabel}
        </label>
      ))}
    </div>
  );
}
