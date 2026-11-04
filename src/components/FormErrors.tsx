import { formErrors } from "../lib/api/errors";
import { Alert } from "./Alert";

type FormErrorsProps = {
  error: unknown;
  // Inputs that show their own message, so the summary leaves those out.
  fields: readonly string[];
};

// The live region stays mounted, so screen readers announce new errors.
export function FormErrors({ error, fields }: FormErrorsProps) {
  const messages = formErrors(error, fields);

  return (
    <div className="flex flex-col gap-8 empty:hidden" role="alert">
      {messages.map((message) => (
        <Alert key={message} tone="danger">
          {message}
        </Alert>
      ))}
    </div>
  );
}
