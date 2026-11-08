import type { RouteObject } from "react-router";
import { GuestRoute } from "../features/auth/components/GuestRoute";
import { RequireRole } from "../features/auth/components/RequireRole";
import { AccountPage } from "../features/auth/pages/AccountPage";
import { CheckEmailPage } from "../features/auth/pages/CheckEmailPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { SavedPage } from "../features/favorites/pages/SavedPage";
import { MechanicPage } from "../features/mechanics/pages/MechanicPage";
import { MechanicsPage } from "../features/mechanics/pages/MechanicsPage";
import { WorkshopProfilePage } from "../features/mechanics/pages/WorkshopProfilePage";
import { MyListingsPage } from "../features/listings/pages/MyListingsPage";
import { CarDetailsPage } from "../features/listings/pages/CarDetailsPage";
import { DraftListingPage } from "../features/listings/pages/DraftListingPage";
import { ExplorePage } from "../features/listings/pages/ExplorePage";
import { ListingMediaPage } from "../features/listings/pages/ListingMediaPage";
import { ListingPage } from "../features/listings/pages/ListingPage";
import { NewListingPage } from "../features/listings/pages/NewListingPage";
import { PhotosPage } from "../features/listings/pages/PhotosPage";
import { ReviewPage } from "../features/listings/pages/ReviewPage";
import { SearchPage } from "../features/listings/pages/SearchPage";
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
          { path: paths.home, element: <ExplorePage /> },
          { path: paths.search, element: <SearchPage /> },
          { path: paths.listing, element: <ListingPage /> },
          { path: paths.mechanics, element: <MechanicsPage /> },
          { path: paths.mechanic, element: <MechanicPage /> },
          {
            element: <RequireRole allowed="seller" />,
            children: [{ path: paths.myListings, element: <MyListingsPage /> }],
          },
          {
            element: <RequireRole allowed="buyer" />,
            children: [{ path: paths.saved, element: <SavedPage /> }],
          },
          {
            element: <RequireRole allowed="mechanic" />,
            children: [{ path: paths.workshop, element: <WorkshopProfilePage /> }],
          },
          {
            element: <RequireRole />,
            children: [{ path: paths.account, element: <AccountPage /> }],
          },
        ],
      },
      {
        // These pages have their own header and actions on small screens.
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
              // Its confirm bar sticks to the bottom, where the tab bar would be.
              { path: paths.listingMedia, element: <ListingMediaPage /> },
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
