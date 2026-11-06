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
import { CarDetailsPage } from "../features/listings/pages/CarDetailsPage";
import { DraftListingPage } from "../features/listings/pages/DraftListingPage";
import { NewListingPage } from "../features/listings/pages/NewListingPage";
import { PhotosPage } from "../features/listings/pages/PhotosPage";
import { ReviewPage } from "../features/listings/pages/ReviewPage";
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
      {
        // The wizard has its own header and actions on small screens.
        element: <AppLayout focusedOnMobile />,
        children: [
          {
            element: <RequireRole allowed="seller" />,
            children: [
              { path: paths.newListing, element: <NewListingPage /> },
              { path: paths.draftListing, element: <DraftListingPage /> },
              { path: paths.draftCar, element: <CarDetailsPage /> },
              { path: paths.draftPhotos, element: <PhotosPage /> },
              { path: paths.draftReview, element: <ReviewPage /> },
            ],
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
