export type PasswordRule = {
  id: "length" | "case" | "number" | "symbol";
  met: boolean;
};

// Live feedback only, matching the API's rule. The API still decides.
export const passwordRules = (password: string): PasswordRule[] => [
  { id: "length", met: password.length >= 8 },
  { id: "case", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  { id: "number", met: /[0-9]/.test(password) },
  { id: "symbol", met: /[!@#,;()$%^&*\-/.+]/.test(password) },
];
