import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import i18n from "../../../lib/i18n";
import { server } from "../../../test/bootstrap";
import { testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const garage = (id: number, name: string, rating: number | null, price: number | null) => ({
  mechanicId: id,
  name,
  cityId: 1,
  address: `${id} Rue Example`,
  latitude: 33.57,
  longitude: -7.59,
  inspectionPrice: price,
  profileImageLink: null,
  averageRating: rating,
  reviewCount: rating === null ? 0 : 10 + id,
});

const casablanca = [
  garage(11, "Garage Atlas Auto", 4.9, 350),
  garage(12, "Diagnostic Pro", 4.8, 300),
  garage(13, "Clinique Auto", 4.7, 400),
  garage(14, "Speedy Check", 4.6, 280),
  garage(15, "Garage du Phare", null, null),
];

const signIn = (role: string) =>
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role } }),
    ),
  );

// Casablanca has five garages and Agadir none. Records each request.
const rankingsApi = (totalPages = 1) => {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get("*/api/mechanics/rankings", ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      const rankings = query.get("cityId") === "1" ? casablanca : [];
      return HttpResponse.json({
        rankings,
        meta: { total: rankings.length, page: Number(query.get("page")), limit: 20, totalPages },
      });
    }),
  );
  return queries;
};

const garageList = async () => screen.findByRole("list", { name: /^Garages in/u });

describe("MechanicsPage", () => {
  it("ranks the garages of the visitor's city, best first", async () => {
    signIn("buyer");
    const queries = rankingsApi();
    renderApp("/mechanics");

    expect(await screen.findByRole("heading", { level: 1, name: "Best garages in Casablanca" })).toBeInTheDocument();
    const podium = await screen.findByRole("list", { name: "Top three garages" });
    expect(within(podium).getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
      "Garage Atlas Auto",
      "Diagnostic Pro",
      "Clinique Auto",
    ]);
    const list = await garageList();
    const fourth = within(list).getAllByRole("listitem")[3];
    expect(fourth).toHaveTextContent("Rank 4");
    expect(fourth).toHaveTextContent("Speedy Check");
    expect(fourth).toHaveTextContent("14 Rue Example, Casablanca");
    expect(fourth).toHaveTextContent("280 MAD");
    expect(within(list).getByText("Rated 4.6 out of 5 from 24 reviews")).toBeInTheDocument();
    expect(queries[0]?.get("cityId")).toBe("1");
    expect(queries[0]?.get("page")).toBe("1");
  });

  it("shows when a garage has no reviews or price yet", async () => {
    rankingsApi();
    renderApp("/mechanics?city=1");

    const last = within(await garageList()).getAllByRole("listitem")[4];
    expect(last).toHaveTextContent("No reviews yet");
    expect(last).toHaveTextContent("Price at the garage");
  });

  it("changes the city, and says when it has no garage", async () => {
    const user = userEvent.setup();
    rankingsApi();
    renderApp("/mechanics?city=1&page=1");

    await garageList();
    await user.selectOptions(screen.getByLabelText("City"), "Agadir");

    expect(await screen.findByRole("heading", { level: 1, name: "Best garages in Agadir" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "No garage in Agadir yet" })).toBeInTheDocument();
    expect(screen.queryByText("Garage Atlas Auto")).not.toBeInTheDocument();
  });

  it("numbers the garages of later pages after the earlier ones", async () => {
    const queries = rankingsApi(3);
    renderApp("/mechanics?city=1&page=2");

    const list = await garageList();
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("Rank 21");
    expect(screen.queryByRole("list", { name: "Top three garages" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("href", "/mechanics?city=1&page=3");
    expect(queries[0]?.get("page")).toBe("2");
  });

  it("invites visitors to sign up as a partner garage", async () => {
    rankingsApi();
    renderApp("/mechanics?city=1");

    expect(await screen.findByRole("link", { name: "Become a partner garage" })).toHaveAttribute(
      "href",
      "/register?role=mechanic",
    );
  });

  it("links mechanics to their own workshop", async () => {
    signIn("mechanic");
    rankingsApi();
    renderApp("/mechanics");

    await garageList();
    const workshopLinks = screen.getAllByRole("link", { name: "My workshop" });
    expect(workshopLinks.some((link) => link.getAttribute("href") === "/workshop")).toBe(true);
    expect(screen.queryByRole("link", { name: "Become a partner garage" })).not.toBeInTheDocument();
  });

  it("shows the API's message when the rankings fail", async () => {
    server.use(
      http.get("*/api/mechanics/rankings", () =>
        HttpResponse.json({ errors: [{ code: "server.error", message: "Rankings are down." }] }, { status: 500 }),
      ),
    );
    renderApp("/mechanics?city=1");

    // The client tries once more before giving up.
    expect(await screen.findByRole("alert", {}, { timeout: 3000 })).toHaveTextContent("Rankings are down.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  // The test catalog names the cities in Latin letters in every language.
  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    rankingsApi();
    renderApp("/mechanics?city=1");

    expect(await screen.findByRole("heading", { level: 1, name: "أفضل الورشات في Casablanca" })).toBeInTheDocument();
  });
});
