import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testCar, testMedia } from "../../../test/fixtures";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const media = [testMedia(1, { isPrimary: true }), testMedia(2), testMedia(3, { type: "video" })];

const renderListing = (listing: Record<string, unknown> = {}) => {
  server.use(
    http.get("*/api/listings/7", () =>
      HttpResponse.json({
        listing: {
          id: 7,
          title: "My Golf",
          description: "Clean car",
          status: "approved",
          car: { ...testCar, carMedias: media },
          user: { firstName: "Karim", lastName: "Idrissi", isVerified: true, city: null },
          ...listing,
        },
      }),
    ),
  );
  return renderApp("/listings/7");
};

describe("ListingPage", () => {
  it("shows the car, its equipment and its seller", async () => {
    renderListing();

    expect(await screen.findByRole("heading", { level: 1, name: "My Golf" })).toBeInTheDocument();
    expect(screen.getByText("Clean car")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.getByText("ABS")).toBeInTheDocument();
    expect(screen.getByText("Karim Idrissi")).toBeInTheDocument();
    expect(screen.queryByText(/Only you can see this listing/u)).not.toBeInTheDocument();
  });

  it("opens photos and videos in the viewer", async () => {
    const user = userEvent.setup();
    renderListing();

    // The grid for wide screens. Small screens get the carousel.
    const grid = await screen.findByRole("list", { name: "Photos and videos" });
    await user.click(within(grid).getByRole("button", { name: "View Photo 2" }));

    const viewer = screen.getByRole("dialog", { name: "Photos and videos of My Golf" });
    expect(within(viewer).getByRole("img", { name: "Photo 2" })).toBeInTheDocument();
    expect(within(viewer).getByText("2 / 3")).toBeInTheDocument();

    await user.click(within(viewer).getByRole("button", { name: "Next" }));
    expect(within(viewer).getByLabelText("Video 3")).toBeInTheDocument();

    // The last item leads back to the first.
    await user.keyboard("{ArrowRight}");
    expect(within(viewer).getByRole("img", { name: "Photo 1" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(within(viewer).getByLabelText("Video 3")).toBeInTheDocument();

    await user.click(within(viewer).getByRole("button", { name: "Show Photo 2" }));
    expect(within(viewer).getByRole("img", { name: "Photo 2" })).toBeInTheDocument();

    await user.click(within(viewer).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cycles through the media in place on small screens, and opens one full screen", async () => {
    const user = userEvent.setup();
    renderListing();

    const carousel = await screen.findByRole("region", { name: "Photos and videos" });
    expect(within(carousel).getByText("1 / 3")).toBeInTheDocument();

    await user.click(within(carousel).getByRole("button", { name: "Next photo or video" }));
    expect(within(carousel).getByText("2 / 3")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // The first item leads back to the last.
    await user.click(within(carousel).getByRole("button", { name: "Previous photo or video" }));
    await user.click(within(carousel).getByRole("button", { name: "Previous photo or video" }));
    expect(within(carousel).getByText("3 / 3")).toBeInTheDocument();

    await user.click(within(carousel).getByRole("button", { name: "View Video 3" }));
    const viewer = screen.getByRole("dialog", { name: "Photos and videos of My Golf" });
    expect(within(viewer).getByLabelText("Video 3")).toBeInTheDocument();
  });

  it("tells the seller a listing in review isn't public yet", async () => {
    renderListing({ status: "pending" });

    expect(await screen.findByText(/Only you can see this listing/u)).toBeInTheDocument();
  });

  it("waits for the session before asking for a listing only its seller can see", async () => {
    server.use(
      // The page loads before the session is restored, as after a refresh.
      http.post("*/api/auth/refresh-token", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } });
      }),
      // Like the API, a pending listing is only found with its seller's token.
      http.get("*/api/listings/7", ({ request }) =>
        request.headers.get("Authorization") === "Bearer token"
          ? HttpResponse.json({
              listing: { id: 7, title: "My Golf", description: "Clean car", status: "pending", car: testCar },
            })
          : apiErrors(404, { code: "listing.not_found", message: "Listing not found" }),
      ),
    );
    renderApp("/listings/7");

    expect(await screen.findByRole("heading", { level: 1, name: "My Golf" })).toBeInTheDocument();
    expect(screen.queryByText("Listing not found")).not.toBeInTheDocument();
  });

  it("shows the API's message for a listing that isn't public", async () => {
    server.use(
      http.get("*/api/listings/7", () =>
        apiErrors(404, { code: "listing.not_found", message: "Listing not found" }),
      ),
    );
    renderApp("/listings/7");

    expect(await screen.findByRole("alert")).toHaveTextContent("Listing not found");
  });
});
