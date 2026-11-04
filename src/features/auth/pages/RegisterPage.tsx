import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { LanguageMenu } from "../../../components/LanguageMenu";
import { LanguageSegmented } from "../../../components/LanguageSegmented";
import { Logo } from "../../../components/Logo";
import { PageTitle } from "../../../components/PageTitle";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { TextLink } from "../../../components/TextLink";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { paths } from "../../../lib/paths";
import { signupRoles } from "../api";
import type { SignupRole } from "../api";
import { BrandPanel } from "../components/BrandPanel";
import { EmailField } from "../components/EmailField";
import { PasswordStrength } from "../components/PasswordStrength";
import { ProfilePhotoField } from "../components/ProfilePhotoField";
import { RoleSelector } from "../components/RoleSelector";
import { rawValue, textValue } from "../formValues";
import { useCityOptions, useRegister } from "../hooks";

const fields = [
  "firstName",
  "lastName",
  "email",
  "password",
  "phone",
  "userType",
  "cityId",
  "imageName",
];

const isSignupRole = (value: string): value is SignupRole =>
  signupRoles.some((role) => role === value);

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const register = useRegister();
  const cities = useCityOptions();
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  useFocusFirstInvalid(form, register.error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);

    const email = textValue(values, "email");
    const userType = textValue(values, "userType");
    register.mutate(
      {
        input: {
          firstName: textValue(values, "firstName"),
          lastName: textValue(values, "lastName"),
          email,
          password: rawValue(values, "password"),
          phone: textValue(values, "phone"),
          userType: isSignupRole(userType) ? userType : "buyer",
          cityId: Number(textValue(values, "cityId")),
        },
        photo,
      },
      {
        onSuccess: ({ photoFailed }) => {
          void navigate(paths.checkEmail, { state: { email, photoFailed } });
        },
      },
    );
  };

  const error = register.error;

  return (
    <div className="flex min-h-dvh">
      <PageTitle>{t("register.pageTitle")}</PageTitle>
      <BrandPanel />
      <main
        className="flex flex-1 justify-center px-20 py-24 outline-none md:px-48 md:py-48"
        tabIndex={-1}
      >
        <form
          className="flex w-full max-w-auth-wide flex-col gap-24"
          noValidate
          onSubmit={submit}
          ref={form}
        >
          <div className="flex items-center justify-between gap-8 lg:hidden">
            <Link to={paths.home}>
              <Logo />
            </Link>
            <LanguageMenu />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-8">
            <span className="type-overline text-muted">{t("register.step")}</span>
            <span className="type-body-s text-muted">
              {t("register.alreadyMember")}{" "}
              <TextLink to={paths.login}>{t("register.logIn")}</TextLink>
            </span>
          </div>
          <div className="flex flex-col gap-8">
            <h1 className="type-h1 text-ink">{t("register.title")}</h1>
            <p className="type-body-m text-muted">{t("register.description")}</p>
          </div>
          <div className="flex flex-col gap-8">
            <LanguageSegmented label={t("register.language")} />
            <p className="type-body-xs text-muted">{t("register.languageHelper")}</p>
          </div>
          <RoleSelector error={fieldError(error, "userType")} />
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
            <TextField
              autoComplete="given-name"
              error={fieldError(error, "firstName")}
              label={t("fields.firstName")}
              name="firstName"
            />
            <TextField
              autoComplete="family-name"
              error={fieldError(error, "lastName")}
              label={t("fields.lastName")}
              name="lastName"
            />
          </div>
          <EmailField error={fieldError(error, "email")} />
          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
            <TextField
              autoComplete="tel"
              dir="auto"
              error={fieldError(error, "phone")}
              icon="phone"
              inputMode="tel"
              label={t("fields.phone")}
              name="phone"
              type="tel"
            />
            <SelectField
              defaultValue=""
              disabled={cities.isPending}
              error={
                fieldError(error, "cityId") ??
                (cities.isError ? t("register.citiesFailed") : undefined)
              }
              icon="map-pin"
              label={t("fields.city")}
              name="cityId"
            >
              <option disabled value="">
                {t(cities.isPending ? "register.citiesLoading" : "register.cityPlaceholder")}
              </option>
              {cities.options.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex flex-col gap-8">
            <TextField
              autoComplete="new-password"
              dir="auto"
              error={fieldError(error, "password")}
              icon="lock"
              label={t("fields.password")}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            <PasswordStrength password={password} />
          </div>
          <ProfilePhotoField
            error={fieldError(error, "imageName")}
            onChange={setPhoto}
            photo={photo}
          />
          <FormErrors error={error} fields={fields} />
          <Button block isPending={register.isPending} size="l" type="submit" variant="primary">
            {t("register.submit")}
            <Icon name="arrow-right" />
          </Button>
          <p className="text-center type-body-xs text-muted">{t("register.emailNote")}</p>
        </form>
      </main>
    </div>
  );
}
