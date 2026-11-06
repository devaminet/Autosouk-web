import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testCar, testDraft, testMedia } from "../../../test/fixtures";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const car = {
  ...testCar,
  carMedias: [testMedia(1, { isPrimary: true }), testMedia(2), testMedia(3)],
};

const renderStep = (listing: { current: unknown }) => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } }),
    ),
    http.get("*/api/listings/7", () => HttpResponse.json({ listing: listing.current })),
  );
  return renderApp("/my-listings/7/review");
};

describe("ReviewPage", () => {
  it("sums up the draft and submits it for review", async () => {
    const user = userEvent.setup();
    const listing = { current: { ...testDraft, car } };
    let submitted = false;
    server.use(
      http.post("*/api/listings/7/submit", () => {
        submitted = true;
        listing.current = { ...testDraft, status: "pending", car };
        return HttpResponse.json({ listing: { id: 7, status: "pending" } });
      }),
    );
    renderStep(listing);

    const facts = await screen.findByRole("heading", { name: "Car details", level: 2 });
    const section = facts.closest("section");
    expect(section).not.toBeNull();
    if (section) {
      expect(within(section).getByText("VOLKSWAGEN Golf")).toBeInTheDocument();
      expect(within(section).getByText("Diesel")).toBeInTheDocument();
      expect(within(section).getByText("Very good")).toBeInTheDocument();
    }
    expect(screen.getByText("Clean car")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /^Photo/u })).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    const heading = await screen.findByRole("heading", { name: "Submitted for review" });
    expect(heading).toHaveFocus();
    expect(submitted).toBe(true);
    expect(screen.getByText("Pending review")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to my listings" })).toHaveAttribute("href", "/my-listings");
  });

  it("shows why the API refused the draft", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/listings/7/submit", () =>
        apiErrors(400, { code: "media.min_images", message: "Add at least 3 images" }),
      ),
    );
    renderStep({ current: { ...testDraft, car } });

    await user.click(await screen.findByRole("button", { name: "Submit for review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Add at least 3 images");
  });

  it("links each part to the step that changes it", async () => {
    renderStep({ current: { ...testDraft, car } });

    expect(await screen.findByRole("link", { name: "Edit Listing" })).toHaveAttribute(
      "href",
      "/my-listings/7/listing",
    );
    expect(screen.getByRole("link", { name: "Edit Car details" })).toHaveAttribute("href", "/my-listings/7/car");
    expect(screen.getByRole("link", { name: "Edit Photos & videos" })).toHaveAttribute(
      "href",
      "/my-listings/7/photos",
    );
  });
});
