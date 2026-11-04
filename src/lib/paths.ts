export const paths = {
  home: "/",
  login: "/login",
  register: "/register",
  checkEmail: "/check-email",
  // The API redirects to these two pages from links in its emails.
  verifyEmail: "/verify-email",
  resetPassword: "/reset-password",
  forgotPassword: "/forgot-password",
} as const;
