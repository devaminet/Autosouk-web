import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { CarMedia } from "../api";
import { server } from "../../../test/bootstrap";
import { testCar, testMedia } from "../../../test/fixtures";
import { apiErrors, storageResponse, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const storageUrl = "http://storage.test/cars";

const published = { id: 7, title: "My Golf", description: "Clean car", status: "approved" };

const threePhotos = () => [testMedia(1, { isPrimary: true }), testMedia(2), testMedia(3)];

// The API's listing answers with whatever the test holds at that moment.
const renderPage = (media: { current: CarMedia[] }, status = "approved") => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } }),
    ),
    http.get("*/api/listings/mine", () =>
      HttpResponse.json({
        listings: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0, statusCounts: {} },
      }),
    ),
    http.get("*/api/listings/7", () =>
      HttpResponse.json({ listing: { ...published, status, car: { ...testCar, carMedias: media.current } } }),
    ),
  );
  return renderApp("/my-listings/7/media");
};

const reserve = (ids: number[]) =>
  http.post("*/api/listings/7/media", () =>
    HttpResponse.json(
      {
        carMedia: ids.map((id) => ({
          id,
          filename: `car-${id}.jpg`,
          originalName: `photo-${id}.jpg`,
          upload: { url: storageUrl, fields: { key: `car-${id}.jpg` } },
        })),
      },
      { status: 201 },
    ),
  );

const image = (name: string) => new File(["photo"], name, { type: "image/jpeg" });

const pick = async (user: ReturnType<typeof userEvent.setup>, files: File[]) =>
  user.upload(await screen.findByLabelText(/Add photo or video/u), files);

describe("ListingMediaPage", () => {
  it("holds new files until the seller confirms them, then sends the listing to review", async () => {
    const user = userEvent.setup();
    const media = { current: threePhotos() };
    let confirmed = false;
    server.use(
      reserve([4]),
      http.post(storageUrl, () => storageResponse(204)),
      http.post("*/api/listings/7/media/confirm", () => {
        confirmed = true;
        media.current = [...media.current, testMedia(4)];
        return HttpResponse.json({ uploaded: ["car-4.jpg"], rejected: [], pending: [] });
      }),
    );
    renderPage(media);

    expect(await screen.findByText(/hides it from search/u)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Photos & videos" })).toBeInTheDocument();
    expect(screen.getByText("Keep at least 3 photos. Add a replacement before deleting one.")).toBeInTheDocument();

    await pick(user, [image("front.jpg")]);

    expect(await screen.findByText("Ready to confirm")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "New file front.jpg" })).toBeInTheDocument();
    expect(screen.getByText("1 file ready")).toBeInTheDocument();
    expect(confirmed).toBe(false);

    await user.click(screen.getByRole("button", { name: "Confirm and send to review" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Your new files are saved. The listing is back in review.");
    expect(notice).toHaveFocus();
    expect(await screen.findByRole("img", { name: "Photo 4" })).toBeInTheDocument();
    expect(screen.queryByText("Ready to confirm")).not.toBeInTheDocument();
    expect(confirmed).toBe(true);
  });

  it("deletes the new files when the seller discards them", async () => {
    const user = userEvent.setup();
    let deleted: unknown;
    server.use(
      reserve([4, 5]),
      http.post(storageUrl, () => storageResponse(204)),
      http.delete("*/api/listings/7/media", async ({ request }) => {
        deleted = await request.json();
        return HttpResponse.json({ deleted: [4, 5], carMedias: [] });
      }),
    );
    renderPage({ current: threePhotos() });

    await pick(user, [image("front.jpg"), image("back.jpg")]);
    expect(await screen.findByText("2 files ready")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard new files" }));

    expect(await screen.findByLabelText(/Add photo or video/u)).toBeInTheDocument();
    expect(screen.queryByText("Ready to confirm")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm and send to review" })).not.toBeInTheDocument();
    expect(deleted).toEqual({ mediaIds: [4, 5] });
  });

  it("lets the seller retry a failed upload", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    server.use(
      reserve([4]),
      http.post(storageUrl, () => {
        attempts += 1;
        return storageResponse(attempts === 1 ? 403 : 204);
      }),
      http.delete("*/api/listings/7/media", () => HttpResponse.json({ deleted: [4], carMedias: [] })),
    );
    renderPage({ current: threePhotos() });

    await pick(user, [image("front.jpg")]);
    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
    expect(screen.getByText("1 failed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry front.jpg" }));

    expect(await screen.findByText("Ready to confirm")).toBeInTheDocument();
    expect(screen.queryByText("Upload failed")).not.toBeInTheDocument();
  });

  it("discards unconfirmed files when the seller leaves", async () => {
    const user = userEvent.setup();
    let deleted: unknown;
    server.use(
      reserve([4]),
      http.post(storageUrl, () => storageResponse(204)),
      http.delete("*/api/listings/7/media", async ({ request }) => {
        deleted = await request.json();
        return HttpResponse.json({ deleted: [4], carMedias: [] });
      }),
    );
    const router = renderPage({ current: threePhotos() });

    await pick(user, [image("front.jpg")]);
    await screen.findByText("Ready to confirm");
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    await user.click(within(breadcrumb).getByRole("link", { name: "My listings" }));

    expect(router.state.location.pathname).toBe("/my-listings");
    await expect.poll(() => deleted).toEqual({ mediaIds: [4] });
  });

  it("shows why the API refuses to delete a photo", async () => {
    const user = userEvent.setup();
    server.use(
      http.delete("*/api/listings/7/media", () =>
        apiErrors(400, { code: "media.min_images", message: "A car needs at least 3 images.", field: "mediaIds" }),
      ),
    );
    renderPage({ current: threePhotos() });

    await user.click(await screen.findByRole("button", { name: "Delete Photo 2" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A car needs at least 3 images.");
  });

  it("sends a draft to the wizard and a sold car back to my listings", async () => {
    const draft = renderPage({ current: threePhotos() }, "draft");
    await expect.poll(() => draft.state.location.pathname).toBe("/my-listings/7/photos");
    draft.dispose();

    const sold = renderPage({ current: threePhotos() }, "sold");
    await expect.poll(() => sold.state.location.pathname).toBe("/my-listings");
  });
});
