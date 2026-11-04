import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { InitialEntry } from "react-router";
import { AppProviders } from "../app/AppProviders";
import { routes } from "../app/routes";

// Renders the real routes and providers. Only the network is mocked.
export const renderApp = (entry: InitialEntry = "/") => {
  const router = createMemoryRouter(routes, { initialEntries: [entry] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
};
