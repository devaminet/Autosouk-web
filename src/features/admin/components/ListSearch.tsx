import { useEffect, useRef, useState } from "react";
import { TextField } from "../../../components/TextField";

type ListSearchProps = {
  label: string;
  placeholder: string;
  value: string;
  // Called once typing pauses, not on every key.
  onSearch: (value: string) => void;
};

export function ListSearch({ label, placeholder, value, onSearch }: ListSearchProps) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  return (
    <TextField
      fieldClassName="min-w-0 flex-1 md:max-w-dialog"
      icon="search"
      label={label}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (timer.current) {
          clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => onSearch(next.trim()), 300);
      }}
      placeholder={placeholder}
      type="search"
      value={text}
    />
  );
}
