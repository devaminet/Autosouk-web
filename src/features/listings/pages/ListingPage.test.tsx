import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testCar, testMedia } from "../../../test/fixtures";
import { apiErrors } from "../../../test/handlers";
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

    await user.click(await screen.findByRole("button", { name: "View Photo 2" }));

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

  it("tells the seller a listing in review isn't public yet", async () => {
    renderListing({ status: "pending" });

    expect(await screen.findByText(/Only you can see this listing/u)).toBeInTheDocument();
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
