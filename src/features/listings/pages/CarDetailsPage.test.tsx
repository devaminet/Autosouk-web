import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testCar, testDraft } from "../../../test/fixtures";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const draft = testDraft;
const savedCar = testCar;

const renderStep = (listing: unknown, entry = "/my-listings/7/car") => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } }),
    ),
    http.get("*/api/listings/7", () => HttpResponse.json({ listing })),
  );
  return renderApp(entry);
};

describe("CarDetailsPage", () => {
  it("attaches a new car with what the seller filled in", async () => {
    const user = userEvent.setup();
    let sent: unknown;
    server.use(
      http.post("*/api/listings/7/car", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ id: 70 }, { status: 201 });
      }),
    );
    const router = renderStep(draft);

    await user.selectOptions(await screen.findByLabelText("Make"), "VOLKSWAGEN");
    await user.selectOptions(screen.getByLabelText("Model"), await screen.findByRole("option", { name: "Golf" }));
    await user.selectOptions(screen.getByLabelText("Year"), "2020");
    await user.type(screen.getByLabelText("Price"), "265 000");
    await user.type(screen.getByLabelText("Mileage"), "54000");
    await user.selectOptions(screen.getByLabelText("City"), "Casablanca");
    await user.click(screen.getByRole("radio", { name: "Diesel" }));
    await user.click(screen.getByRole("radio", { name: "Automatic" }));
    await user.click(screen.getByRole("radio", { name: "5" }));
    await user.type(screen.getByLabelText("Fiscal power"), "8");
    await user.click(screen.getByRole("button", { name: "More: Previous owners" }));
    await user.selectOptions(screen.getByLabelText("Origin"), "Customs cleared");
    await user.click(screen.getByRole("radio", { name: "Very good" }));
    await user.click(screen.getByRole("button", { name: /Safety/u }));
    await user.click(screen.getByRole("checkbox", { name: "ABS" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Your draft is saved.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/my-listings");
    expect(sent).toEqual({
      makeId: 482,
      modelId: 10,
      year: 2020,
      price: 265000,
      distance: "54000",
      cityId: 1,
      carburantId: 1,
      transmission: "automatic",
      doorsNumber: 5,
      fiscalPower: 8,
      ownersCount: 1,
      originId: 1,
      stateId: 2,
      equipmentIds: [1],
    });
  });

  it("shows the saved car, sends changes as an update and continues to photos", async () => {
    const user = userEvent.setup();
    let sent: unknown;
    server.use(
      http.patch("*/api/listings/7", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ listing: draft });
      }),
    );
    const router = renderStep({ ...draft, car: savedCar });

    const price = await screen.findByLabelText("Price");
    expect(price).toHaveValue("265000");
    expect(await screen.findByRole("option", { name: "Golf", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Automatic" })).toBeChecked();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    await user.clear(price);
    await user.type(price, "259000");
    await user.click(screen.getByRole("button", { name: "Continue to photos" }));

    expect(await screen.findByRole("heading", { name: "Photos & videos", level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/my-listings/7/photos");
    expect(sent).toMatchObject({ car: { price: 259000, makeId: 482, equipmentIds: [1] } });
  });

  it("shows the API's errors next to their inputs, from a new car or an update", async () => {
    const user = userEvent.setup();
    server.use(
      http.patch("*/api/listings/7", () =>
        apiErrors(
          400,
          { code: "validation.too_small", message: "Price must be positive", field: "car.price" },
          { code: "validation.required", message: "Choose a condition", field: "car.stateId" },
        ),
      ),
    );
    renderStep({ ...draft, car: savedCar });

    await user.click(await screen.findByRole("button", { name: "Continue to photos" }));

    const price = screen.getByLabelText("Price");
    expect(await screen.findByText("Price must be positive")).toBeInTheDocument();
    expect(price).toHaveAccessibleDescription("Price must be positive");
    expect(price).toHaveFocus();
    expect(screen.getByRole("radiogroup", { name: "Condition" })).toHaveAccessibleDescription(
      /Choose a condition/u,
    );
  });

  it("clears the model when the make changes", async () => {
    const user = userEvent.setup();
    renderStep({ ...draft, car: savedCar });

    await screen.findByRole("option", { name: "Golf", selected: true });
    await user.selectOptions(screen.getByLabelText("Make"), "KIA");

    expect(await screen.findByRole("option", { name: "Sportage" })).toBeInTheDocument();
    expect(screen.getByLabelText("Model")).toHaveValue("");
  });

  it("finds equipment by name across categories", async () => {
    const user = userEvent.setup();
    renderStep(draft);

    await user.type(await screen.findByLabelText("Search equipment"), "carplay");

    expect(screen.getByRole("checkbox", { name: "Apple CarPlay" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "ABS" })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search equipment"));
    await user.type(screen.getByLabelText("Search equipment"), "zzz");

    expect(screen.getByText("No equipment matches “zzz”.")).toBeInTheDocument();
  });

  it("goes back to the listing step with the saved text, then returns", async () => {
    const user = userEvent.setup();
    let sent: unknown;
    server.use(
      http.patch("*/api/listings/7", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ listing: draft });
      }),
    );
    const router = renderStep(draft);

    await user.click(await screen.findByRole("link", { name: "Back" }));

    expect(await screen.findByLabelText("Title")).toHaveValue("My Golf");
    expect(router.state.location.pathname).toBe("/my-listings/7/listing");

    await user.type(screen.getByLabelText("Title"), " 8");
    await user.click(screen.getByRole("button", { name: "Continue to car details" }));

    expect(await screen.findByRole("heading", { name: "Car details", level: 1 })).toBeInTheDocument();
    expect(sent).toEqual({ title: "My Golf 8", description: "Clean car" });
  });

  it("deletes the draft when the seller discards it", async () => {
    const user = userEvent.setup();
    let deleted = false;
    server.use(
      http.delete("*/api/listings/7", () => {
        deleted = true;
        return HttpResponse.json({ deleted: true, listingId: 7 });
      }),
    );
    const router = renderStep(draft);

    await user.click(await screen.findByRole("button", { name: "Discard" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete this listing?" });
    await user.click(within(dialog).getByRole("button", { name: "Delete listing" }));

    expect(await screen.findByText("“My Golf” was deleted.")).toBeInTheDocument();
    expect(deleted).toBe(true);
    expect(router.state.location.pathname).toBe("/my-listings");
  });

  it("sends a listing that is no longer a draft back to my listings", async () => {
    const router = renderStep({ ...draft, status: "pending" });

    await screen.findByRole("heading", { name: "My listings" });

    expect(router.state.location.pathname).toBe("/my-listings");
  });

  it("shows the API's error when the listing can't be loaded", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } }),
      ),
      http.get("*/api/listings/7", () =>
        apiErrors(404, { code: "listing.not_found", message: "Listing was not found" }),
      ),
    );
    renderApp("/my-listings/7/car");

    expect(await screen.findByRole("alert", {}, { timeout: 3000 })).toHaveTextContent("Listing was not found");
  });
});
