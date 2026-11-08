import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import { shortName } from "../names";

type StoredReview = { id: number; rating: number; message: string | null; createdAt: string; buyer: { id: number; name: string } };

const mechanic = {
  id: 5,
  userId: 40,
  name: "Garage Atlas Auto",
  cityId: 1,
  address: "Maârif",
  latitude: 33.58,
  longitude: -7.63,
  description: "Independent workshop founded in 2009.",
  phone: "0661234567",
  inspectionPrice: 350,
  profileImageUrl: null,
  isActive: true,
  city: { id: 1, name: "Casablanca", slug: "casablanca" },
  garageImages: [
    { id: 1, link: "http://storage.test/garage-1.jpg" },
    { id: 2, link: "http://storage.test/garage-2.jpg" },
  ],
};

const review = (id: number, rating: number, name: string, buyerId = 100 + id): StoredReview => ({
  id,
  rating,
  message: `Review ${id}`,
  createdAt: "2026-01-02",
  buyer: { id: buyerId, name },
});

const signIn = (role: string, id = testUser.id) =>
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, id, role } }),
    ),
  );

// A workshop with the given reviews, kept in memory so writes show up.
// Records the requests that change something.
const profileApi = ({
  reviews = [review(1, 5, "Youssef Benali"), review(2, 4, "Salma Kadiri")],
  savedCars = [] as { listingId: number; carId: number; title: string }[],
  pageSize = 10,
} = {}) => {
  const stored = [...reviews];
  const sent: { method: string; url: string; body: unknown }[] = [];
  const summary = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const { rating } of stored) {
      distribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
    const average = stored.length ? stored.reduce((sum, { rating }) => sum + rating, 0) / stored.length : null;
    return { average, count: stored.length, distribution };
  };
  const own = () => stored.find(({ buyer }) => buyer.id === testUser.id);
  server.use(
    http.get("*/api/mechanics/:id", ({ params }) =>
      params.id === "5"
        ? HttpResponse.json({ mechanic: { ...mechanic, rating: summary() } })
        : HttpResponse.json({ errors: [{ code: "mechanic.profile_not_found", message: "Workshop not found." }] }, { status: 404 }),
    ),
    http.get("*/api/mechanics/5/reviews", ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get("page"));
      const slice = stored.slice((page - 1) * pageSize, page * pageSize);
      return HttpResponse.json({
        reviews: slice,
        rating: summary(),
        meta: { total: stored.length, page, limit: pageSize, totalPages: Math.ceil(stored.length / pageSize) },
      });
    }),
    http.get("*/api/mechanics/5/reviews/me", () => {
      const mine = own();
      return mine
        ? HttpResponse.json({ review: { ...mine, buyer: undefined } })
        : HttpResponse.json({ errors: [{ code: "review.not_found", message: "No review." }] }, { status: 404 });
    }),
    http.post("*/api/mechanics/5/reviews", async ({ request }) => {
      const body = (await request.json()) as { rating: number; message: string };
      sent.push({ method: "POST", url: request.url, body });
      if (body.message.includes("rude")) {
        return HttpResponse.json(
          { errors: [{ code: "validation.inappropriate_content", message: "Inappropriate content.", field: "message" }] },
          { status: 400 },
        );
      }
      const created = { ...review(99, body.rating, "Amine Takha", testUser.id), message: body.message };
      stored.unshift(created);
      return HttpResponse.json({ review: created }, { status: 201 });
    }),
    http.patch("*/api/mechanics/5/reviews/me", async ({ request }) => {
      const body = (await request.json()) as { rating: number; message: string };
      sent.push({ method: "PATCH", url: request.url, body });
      const mine = own();
      if (mine) {
        Object.assign(mine, body);
      }
      return HttpResponse.json({ review: mine });
    }),
    http.delete("*/api/mechanics/5/reviews/me", ({ request }) => {
      sent.push({ method: "DELETE", url: request.url, body: null });
      const index = stored.findIndex(({ buyer }) => buyer.id === testUser.id);
      stored.splice(index, 1);
      return HttpResponse.json({ deleted: true });
    }),
    http.get("*/api/favorite_listings", ({ request }) => {
      sent.push({ method: "GET", url: request.url, body: null });
      return HttpResponse.json({
        listings: savedCars.map(({ listingId, carId, title }) => ({
          id: listingId,
          title,
          status: "approved",
          savedAt: "2026-01-02T10:00:00.000Z",
          inspectionScore: null,
          car: {
            id: carId,
            makeId: 482,
            modelId: 10,
            price: 245000,
            year: 2020,
            distance: "72000",
            transmission: "manual",
            carburant: null,
            carMedias: [],
            city: { name: "Casablanca", slug: "casablanca" },
          },
        })),
        meta: { total: savedCars.length, page: 1, limit: 100, totalPages: 1 },
        counts: { all: savedCars.length, inspected: 0 },
      });
    }),
    http.post("*/api/inspections", async ({ request }) => {
      sent.push({ method: "POST", url: request.url, body: await request.json() });
      return HttpResponse.json({ inspection: { id: 1 } }, { status: 201 });
    }),
  );
  return sent;
};

const reviewList = async () => {
  const panel = await screen.findByRole("tabpanel", { name: /^Reviews/u });
  return within(panel);
};

describe("shortName", () => {
  it("keeps the first name and the last name's initial", () => {
    expect(shortName("Youssef Benali")).toBe("Youssef B.");
    expect(shortName("  Salma  El Kadiri ")).toBe("Salma K.");
    expect(shortName("Youssef")).toBe("Youssef");
  });
});

describe("MechanicPage", () => {
  it("shows the workshop with its rating, price and reviews", async () => {
    profileApi();
    renderApp("/mechanics/5");

    expect(await screen.findByRole("heading", { level: 1, name: "Garage Atlas Auto" })).toBeInTheDocument();
    expect(screen.getByText("Accepting requests")).toBeInTheDocument();
    expect(screen.getAllByText("Maârif, Casablanca").length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Inspection" })).toHaveTextContent("350 MAD");
    expect(screen.getByRole("link", { name: /Call/u })).toHaveAttribute("href", "tel:0661234567");
    expect(screen.getByRole("heading", { name: "About the workshop" })).toBeInTheDocument();

    const reviews = await reviewList();
    expect(await reviews.findByRole("heading", { name: "Youssef B." })).toBeInTheDocument();
    expect(reviews.getByRole("heading", { name: "Salma K." })).toBeInTheDocument();
    expect(reviews.getByText("Rated 5 out of 5")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reviews 2" })).toHaveAttribute("aria-selected", "true");
  });

  it("asks visitors to log in to request an inspection or write a review", async () => {
    profileApi();
    renderApp("/mechanics/5");

    expect(await screen.findByRole("link", { name: "Log in to request an inspection" })).toHaveAttribute("href", "/login");
    expect(await screen.findByRole("link", { name: "Log in to write a review" })).toHaveAttribute("href", "/login");
  });

  it("shows the garage photos in their own tab", async () => {
    const user = userEvent.setup();
    profileApi();
    renderApp("/mechanics/5");

    await user.click(await screen.findByRole("tab", { name: "Garage photos 2" }));

    const panel = screen.getByRole("tabpanel", { name: /^Garage photos/u });
    expect(within(panel).getAllByRole("img")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Garage photos 2" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    profileApi();
    renderApp("/mechanics/5");

    await user.click(await screen.findByRole("tab", { name: "Reviews 2" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Garage photos 2" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: /^Garage photos/u })).toBeInTheDocument();
  });

  it("loads more reviews on demand", async () => {
    const user = userEvent.setup();
    profileApi({
      reviews: [review(1, 5, "Youssef Benali"), review(2, 4, "Salma Kadiri"), review(3, 3, "Omar Alami")],
      pageSize: 2,
    });
    renderApp("/mechanics/5");

    const reviews = await reviewList();
    await reviews.findByRole("heading", { name: "Salma K." });
    expect(reviews.queryByRole("heading", { name: "Omar A." })).not.toBeInTheDocument();

    await user.click(reviews.getByRole("button", { name: "Load more reviews" }));

    expect(await reviews.findByRole("heading", { name: "Omar A." })).toBeInTheDocument();
    expect(reviews.queryByRole("button", { name: "Load more reviews" })).not.toBeInTheDocument();
  });

  it("requests an inspection of a saved car in the workshop's city", async () => {
    const user = userEvent.setup();
    signIn("buyer");
    const sent = profileApi({
      savedCars: [
        { listingId: 7, carId: 70, title: "VW Golf 8 Life" },
        { listingId: 8, carId: 80, title: "Fiat 500" },
      ],
    });
    renderApp("/mechanics/5");

    await user.selectOptions(await screen.findByLabelText("Car to inspect"), "Fiat 500 · 2020");
    await user.click(screen.getByRole("button", { name: "Request inspection" }));

    expect(await screen.findByText("Request sent")).toBeInTheDocument();
    expect(sent.find(({ url }) => url.includes("favorite_listings"))?.url).toContain("cityId=1");
    expect(sent.find(({ url }) => url.endsWith("/api/inspections"))?.body).toEqual({ carId: 80, mechanicId: 5 });
  });

  it("tells buyers without a saved car in the city how to get one", async () => {
    signIn("buyer");
    profileApi();
    renderApp("/mechanics/5");

    expect(
      await screen.findByText("Save a car for sale in Casablanca to ask this workshop to inspect it."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find a car" })).toBeInTheDocument();
  });

  it("lets buyers write a review, and asks for a rating first", async () => {
    const user = userEvent.setup();
    signIn("buyer");
    const sent = profileApi();
    renderApp("/mechanics/5");

    await user.click(await screen.findByRole("button", { name: "Write a review" }));
    const dialog = screen.getByRole("dialog", { name: "Garage Atlas Auto" });
    await user.type(within(dialog).getByLabelText("Your review"), "Clear and quick.");
    await user.click(within(dialog).getByRole("button", { name: "Publish review" }));

    expect(within(dialog).getByText("Choose a rating from 1 to 5 stars.")).toBeInTheDocument();
    expect(sent.some(({ method }) => method === "POST")).toBe(false);

    await user.click(within(dialog).getByRole("radio", { name: "Very good" }));
    expect(within(dialog).getByText("16 / 1 000")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Publish review" }));

    const reviews = await reviewList();
    expect(await reviews.findByRole("heading", { name: "You · Amine T." })).toBeInTheDocument();
    expect(reviews.getByText("Your review")).toBeInTheDocument();
    expect(sent.find(({ method }) => method === "POST")?.body).toEqual({ rating: 4, message: "Clear and quick." });
    expect(screen.queryByRole("button", { name: "Write a review" })).not.toBeInTheDocument();
  });

  it("shows the API's message next to the review", async () => {
    const user = userEvent.setup();
    signIn("buyer");
    profileApi();
    renderApp("/mechanics/5");

    await user.click(await screen.findByRole("button", { name: "Write a review" }));
    const dialog = screen.getByRole("dialog", { name: "Garage Atlas Auto" });
    await user.click(within(dialog).getByRole("radio", { name: "Poor" }));
    await user.type(within(dialog).getByLabelText("Your review"), "So rude");
    await user.click(within(dialog).getByRole("button", { name: "Publish review" }));

    expect(await within(dialog).findByText("Inappropriate content.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Your review")).toHaveAttribute("aria-invalid", "true");
  });

  it("lets buyers change and delete their review", async () => {
    const user = userEvent.setup();
    signIn("buyer");
    const sent = profileApi({
      reviews: [review(1, 5, "Youssef Benali"), { ...review(9, 3, "Amine Takha", testUser.id), message: "Okay." }],
    });
    renderApp("/mechanics/5");

    const reviews = await reviewList();
    await reviews.findByRole("heading", { name: "You · Amine T." });
    // The buyer's review shows once, first.
    expect(reviews.getAllByRole("listitem")[0]).toHaveTextContent("Your review");
    expect(reviews.queryByRole("heading", { name: "Amine T." })).not.toBeInTheDocument();

    await user.click(reviews.getByRole("button", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Garage Atlas Auto" });
    expect(within(dialog).getByRole("radio", { name: "Good" })).toBeChecked();
    expect(within(dialog).getByLabelText("Your review")).toHaveValue("Okay.");
    await user.click(within(dialog).getByRole("radio", { name: "Excellent" }));
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(sent.find(({ method }) => method === "PATCH")?.body).toEqual({ rating: 5, message: "Okay." });

    await user.click(await reviews.findByRole("button", { name: "Delete" }));
    const confirm = screen.getByRole("dialog", { name: "Delete your review?" });
    await user.click(within(confirm).getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("button", { name: "Write a review" })).toBeInTheDocument();
    expect(reviews.queryByText("Your review")).not.toBeInTheDocument();
    expect(sent.some(({ method }) => method === "DELETE")).toBe(true);
  });

  it("links the workshop's own mechanic to the editor", async () => {
    signIn("mechanic", mechanic.userId);
    profileApi();
    renderApp("/mechanics/5");

    expect(await screen.findByRole("link", { name: "Edit my workshop" })).toHaveAttribute("href", "/workshop");
    expect(screen.queryByRole("button", { name: "Request inspection" })).not.toBeInTheDocument();
  });

  it("says when the workshop can't be found", async () => {
    profileApi();
    renderApp("/mechanics/404");

    expect(await screen.findByRole("alert")).toHaveTextContent("Workshop not found.");
    expect(screen.getByRole("link", { name: "See all garages" })).toHaveAttribute("href", "/mechanics");
  });
});
