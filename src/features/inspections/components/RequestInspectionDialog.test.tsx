import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testCar, testMedia } from "../../../test/fixtures";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const garage = (mechanicId: number, name: string, changes: Record<string, unknown> = {}) => ({
  mechanicId,
  name,
  cityId: 1,
  address: "Maârif",
  inspectionPrice: 350,
  averageRating: 4.9,
  reviewCount: 128,
  ...changes,
});

const signIn = (role = "buyer") =>
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role } }),
    ),
  );

// An approved listing in Casablanca, with two garages there. Records the
// garages search and each request.
const renderListing = (status = "approved") => {
  const garageQueries: URLSearchParams[] = [];
  const requests: unknown[] = [];
  server.use(
    http.get("*/api/listings/7", () =>
      HttpResponse.json({
        listing: {
          id: 7,
          title: "Volkswagen Golf 8 Life",
          description: "Clean car",
          status,
          car: { ...testCar, carMedias: [testMedia(1, { isPrimary: true })] },
          user: { firstName: "Karim", lastName: "Idrissi", isVerified: true, city: null },
        },
      }),
    ),
    http.get("*/api/mechanics/rankings", ({ request }) => {
      garageQueries.push(new URL(request.url).searchParams);
      return HttpResponse.json({
        rankings: [
          garage(3, "Garage Atlas Auto"),
          garage(5, "Speedy Check Anfa", { inspectionPrice: 280, averageRating: null, reviewCount: 0 }),
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    }),
    http.post("*/api/inspections", async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json({ inspection: { id: 1 } }, { status: 201 });
    }),
  );
  return { router: renderApp("/listings/7"), garageQueries, requests };
};

// The page has one button for small screens and one beside the price on wide
// ones. CSS hides one of them, which jsdom doesn't apply.
const openDialog = async () => {
  const user = userEvent.setup();
  const [button] = await screen.findAllByRole("button", { name: "Request an inspection" });
  if (button) {
    await user.click(button);
  }
  return { user, dialog: within(screen.getByRole("dialog", { name: "Request an inspection" })) };
};

describe("RequestInspectionDialog", () => {
  it("asks the chosen garage in the car's city to inspect it", async () => {
    signIn();
    const { garageQueries, requests } = renderListing();
    const { user, dialog } = await openDialog();

    expect(dialog.getByText("Choose a garage in Casablanca")).toBeInTheDocument();
    const best = await dialog.findByRole("radio", { name: /Garage Atlas Auto/u });
    expect(best).toBeChecked();
    expect(dialog.getByText("Rated 4.9 out of 5 from 128 reviews")).toBeInTheDocument();
    expect(garageQueries[0]?.get("cityId")).toBe("1");

    await user.click(dialog.getByRole("radio", { name: /Speedy Check Anfa/u }));
    expect(dialog.getByText("No reviews yet")).toBeInTheDocument();
    expect(dialog.getByText("Total due at the garage").parentElement).toHaveTextContent(/280\sMAD/u);

    await user.click(dialog.getByRole("button", { name: "Send request" }));
    expect(await dialog.findByText("Request sent")).toBeInTheDocument();
    expect(dialog.getByText("Speedy Check Anfa will accept or decline your request.")).toBeInTheDocument();
    expect(requests).toEqual([{ carId: 70, mechanicId: 5 }]);

    await user.click(dialog.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the API's message when the car already has an active inspection", async () => {
    signIn();
    renderListing();
    server.use(
      http.post("*/api/inspections", () =>
        apiErrors(400, {
          code: "inspection.already_active",
          message: "This car already has an active inspection request",
        }),
      ),
    );
    const { user, dialog } = await openDialog();

    await dialog.findByRole("radio", { name: /Garage Atlas Auto/u });
    await user.click(dialog.getByRole("button", { name: "Send request" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent("This car already has an active inspection request");
  });

  it("says when no garage in the city inspects cars", async () => {
    signIn();
    renderListing();
    server.use(
      http.get("*/api/mechanics/rankings", () =>
        HttpResponse.json({ rankings: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      ),
    );
    const { dialog } = await openDialog();

    expect(await dialog.findByText("No garage in Casablanca inspects cars yet.")).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Send request" })).toBeDisabled();
  });

  it("asks visitors to log in first", async () => {
    const user = userEvent.setup();
    const { router } = renderListing();

    const [link] = await screen.findAllByRole("link", { name: "Log in to request an inspection" });
    expect(link).toHaveAttribute("href", "/login");
    if (link) {
      await user.click(link);
    }
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state).toEqual({ from: "/listings/7" });
  });

  it("is not offered to sellers", async () => {
    signIn("seller");
    renderListing();
    expect(await screen.findByRole("heading", { level: 1, name: "Volkswagen Golf 8 Life" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request an inspection" })).not.toBeInTheDocument();
  });

  it("is not offered for a listing that isn't approved", async () => {
    signIn();
    renderListing("pending");
    expect(await screen.findByRole("heading", { level: 1, name: "Volkswagen Golf 8 Life" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request an inspection" })).not.toBeInTheDocument();
  });
});
