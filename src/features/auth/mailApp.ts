// Gmail has a web inbox to link to. Other addresses open the device's mail app.
export const mailApp = (
  email: string,
): { href: string; labelKey: string } =>
  email.toLowerCase().endsWith("@gmail.com")
    ? { href: "https://mail.google.com", labelKey: "checkEmail.openGmail" }
    : { href: "mailto:", labelKey: "checkEmail.openMailApp" };
