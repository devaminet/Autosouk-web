import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { CarMedia } from "../api";
import { server } from "../../../test/bootstrap";
import { testCar, testDraft, testMedia } from "../../../test/fixtures";
import { apiErrors, storageResponse, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const storageUrl = "http://storage.test/cars";

// The API's listing answers with whatever media the test holds at that moment.
const renderStep = (media: { current: CarMedia[] }, car: unknown = testCar) => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } }),
    ),
    http.get("*/api/listings/7", () =>
      HttpResponse.json({
        listing: { ...testDraft, car: car && { ...testCar, carMedias: media.current } },
      }),
    ),
  );
  return renderApp("/my-listings/7/photos");
};

const image = (name: string) => new File(["photo"], name, { type: "image/jpeg" });

describe("PhotosPage", () => {
  it("shows the media and what is missing before review", async () => {
    renderStep({ current: [testMedia(1, { isPrimary: true }), testMedia(2), testMedia(3, { type: "video" })] });

    expect(await screen.findByRole("img", { name: "Photo 1" })).toBeInTheDocument();
    expect(screen.getByText("2 photos · 1 video")).toBeInTheDocument();
    expect(screen.getByText("Add 1 more photo (min. 3)")).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 1 more photo" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Make photo 1 the cover" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make photo 3 the cover" })).not.toBeInTheDocument();
  });

  it("uploads picked files to storage, confirms them and shows them", async () => {
    const user = userEvent.setup();
    const media = { current: [testMedia(1, { isPrimary: true }), testMedia(2)] };
    let requested: unknown;
    const stored: string[] = [];
    server.use(
      http.post("*/api/listings/7/media", async ({ request }) => {
        requested = await request.json();
        return HttpResponse.json(
          {
            carMedia: [
              { id: 3, filename: "car-a.jpg", originalName: "front.jpg", upload: { url: storageUrl, fields: { key: "car-a.jpg", "Content-Type": "image/" } } },
              { id: 4, filename: "car-b.jpg", originalName: "front-2.jpg", upload: { url: storageUrl, fields: { key: "car-b.jpg", "Content-Type": "image/" } } },
            ],
          },
          { status: 201 },
        );
      }),
      http.post(storageUrl, async ({ request }) => {
        // jsdom's files can't be parsed back into FormData here, so read the raw body.
        const body = await request.text();
        stored.push(/name="Content-Type"\r\n\r\n(?<type>[^\r]*)/u.exec(body)?.groups?.type ?? "");
        return storageResponse(204);
      }),
      http.post("*/api/listings/7/media/confirm", () => {
        media.current = [...media.current, testMedia(3), testMedia(4)];
        return HttpResponse.json({ uploaded: ["car-a.jpg", "car-b.jpg"], rejected: [], pending: [] });
      }),
    );
    renderStep(media);

    await user.upload(await screen.findByLabelText(/Add photo or video/u), [image("front.jpg"), image("front.jpg")]);

    expect(await screen.findByRole("img", { name: "Photo 4" })).toBeInTheDocument();
    expect(requested).toEqual({ files: [{ name: "front.jpg" }, { name: "front-2.jpg" }] });
    expect(stored).toEqual(["image/jpeg", "image/jpeg"]);
    expect(screen.getByRole("link", { name: "Review listing" })).toHaveAttribute("href", "/my-listings/7/review");
  });

  it("explains refused files and removes uploads that failed", async () => {
    const user = userEvent.setup({ applyAccept: false });
    let deleted: unknown;
    server.use(
      http.post("*/api/listings/7/media", () =>
        HttpResponse.json(
          { carMedia: [{ id: 3, filename: "car-a.jpg", originalName: "side.jpg", upload: { url: storageUrl, fields: {} } }] },
          { status: 201 },
        ),
      ),
      http.post(storageUrl, () => storageResponse(403)),
      http.delete("*/api/listings/7/media", async ({ request }) => {
        deleted = await request.json();
        return HttpResponse.json({ deleted: [3], carMedias: [] });
      }),
    );
    renderStep({ current: [] });

    await user.upload(await screen.findByLabelText(/Add photo or video/u), [image("side.jpg"), image("notes.pdf")]);

    const alert = await screen.findByText("side.jpg: the upload failed. Try again.");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("notes.pdf: only JPG, PNG, WEBP and MP4 files are accepted.")).toBeInTheDocument();
    expect(deleted).toEqual({ mediaIds: [3] });
  });

  it("shows the API's error when storage can't be reserved", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/listings/7/media", () =>
        apiErrors(400, { code: "media.max_files", message: "A car can have up to 20 files", field: "files" }),
      ),
    );
    renderStep({ current: [] });

    await user.upload(await screen.findByLabelText(/Add photo or video/u), image("side.jpg"));

    expect(await screen.findByRole("alert")).toHaveTextContent("A car can have up to 20 files");
  });

  it("makes a photo the cover and deletes media", async () => {
    const user = userEvent.setup();
    const media = { current: [testMedia(1, { isPrimary: true }), testMedia(2)] };
    let deleted: unknown;
    server.use(
      http.patch("*/api/listings/7/media/2/primary", () => {
        media.current = [testMedia(2, { isPrimary: true }), testMedia(1)];
        return HttpResponse.json({ carMedias: media.current });
      }),
      http.delete("*/api/listings/7/media", async ({ request }) => {
        deleted = await request.json();
        media.current = [testMedia(2, { isPrimary: true })];
        return HttpResponse.json({ deleted: [1], carMedias: media.current });
      }),
    );
    renderStep(media);

    await user.click(await screen.findByRole("button", { name: "Make photo 2 the cover" }));

    expect(await screen.findByRole("button", { name: "Make photo 2 the cover" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make photo 1 the cover" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Photo 2" }));

    expect(await screen.findByText("1 photo")).toBeInTheDocument();
    expect(deleted).toEqual({ mediaIds: [1] });
  });

  it("sends a draft without a car to the car step", async () => {
    const router = renderStep({ current: [] }, null);

    await screen.findByRole("heading", { name: "Car details", level: 1 });

    expect(router.state.location.pathname).toBe("/my-listings/7/car");
  });
});
