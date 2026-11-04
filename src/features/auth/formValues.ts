// Reads a text input's value, which FormData types as string or File.
export const textValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

// Passwords keep their spaces.
export const rawValue = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};
