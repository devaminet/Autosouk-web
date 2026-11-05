import type { RouteObject } from "react-router";
import { GuestRoute } from "../features/auth/components/GuestRoute";
import { RequireRole } from "../features/auth/components/RequireRole";
import { CheckEmailPage } from "../features/auth/pages/CheckEmailPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { HomePage } from "../features/home/pages/HomePage";
import { MyListingsPage } from "../features/listings/pages/MyListingsPage";
import { paths } from "../lib/paths";
import { AppLayout } from "./AppLayout";
import { ErrorPage } from "./ErrorPage";
import { NotFoundPage } from "./NotFoundPage";
import { RootLayout } from "./RootLayout";

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: paths.home, element: <HomePage /> },
          {
            element: <RequireRole allowed="seller" />,
            children: [{ path: paths.myListings, element: <MyListingsPage /> }],
          },
        ],
      },
      // Email links can open these whether or not someone is signed in.
      { path: paths.verifyEmail, element: <VerifyEmailPage /> },
      { path: paths.resetPassword, element: <ResetPasswordPage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: paths.login, element: <LoginPage /> },
          { path: paths.register, element: <RegisterPage /> },
          { path: paths.checkEmail, element: <CheckEmailPage /> },
          { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
