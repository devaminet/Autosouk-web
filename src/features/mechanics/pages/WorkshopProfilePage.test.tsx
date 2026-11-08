import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, storageResponse, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const storageUrl = "http://storage.test/mechanics";

const workshop = (changes: Record<string, unknown> = {}) => ({
  id: 5,
  userId: 1,
  name: "Garage Atlas Auto",
  cityId: 1,
  address: "27 Rue Ibnou Mounir, Maârif",
  latitude: 33.5803,
  longitude: -7.6331,
  description: "Full pre-purchase check",
  phone: "0661234567",
  inspectionPrice: 350,
  profileImageUrl: null,
  isActive: true,
  city: { id: 1, name: "Casablanca", slug: "casablanca" },
  garageImages: [],
  rating: { averageRating: 4.9, reviewCount: 128 },
  ...changes,
});

const signIn = (role = "mechanic") =>
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role } }),
    ),
  );

// The workshop the API holds, or none. Records the bodies it receives.
const serveWorkshop = (initial: ReturnType<typeof workshop> | null) => {
  let current = initial;
  const bodies: unknown[] = [];
  server.use(
    http.get("*/api/mechanics/me", () =>
      current
        ? HttpResponse.json({ mechanic: current })
        : apiErrors(404, { code: "mechanic.profile_not_found", message: "Mechanic profile was not found" }),
    ),
    http.post("*/api/mechanics", async ({ request }) => {
      const body = await request.json();
      bodies.push(body);
      current = workshop(Object(body));
      return HttpResponse.json({ mechanic: current }, { status: 201 });
    }),
    http.patch("*/api/mechanics/me", async ({ request }) => {
      const body = await request.json();
      bodies.push(body);
      current = workshop({ ...current, ...Object(body) });
      return HttpResponse.json({ mechanic: current });
    }),
    http.patch("*/api/mechanics/me/status", async ({ request }) => {
      const body = await request.json();
      bodies.push(body);
      current = workshop({ ...current, ...Object(body) });
      return HttpResponse.json({ mechanic: current });
    }),
  );
  return bodies;
};

// jsdom has no geolocation, so each test gives the answer it needs.
const stubLocation = (answer: (success: PositionCallback, failure: PositionErrorCallback) => void) =>
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: answer },
  });

afterEach(() => {
  Reflect.deleteProperty(navigator, "geolocation");
});

// Lookups with each city's centre and reach, so the pin and city stay in sync.
const serveCityAreas = () =>
  server.use(
    http.get("*/api/lookups", () =>
      HttpResponse.json({
        cities: [
          { id: 1, slug: "casablanca", name: "Casablanca", latitude: 33.5731, longitude: -7.5898, radiusKm: 20 },
          { id: 2, slug: "agadir", name: "Agadir", latitude: 30.4278, longitude: -9.5981, radiusKm: 12 },
        ],
        carburants: [],
        states: [],
        origins: [],
      }),
    ),
  );

// The page header's save button. The same button repeats under the map.
const saveButton = (name: string) => {
  const [header] = screen.getAllByRole("button", { name });
  if (!header) {
    throw new Error(`No ${name} button`);
  }
  return header;
};

describe("WorkshopProfilePage", () => {
  it("sets up a new workshop with the browser's location", async () => {
    signIn();
    const bodies = serveWorkshop(null);
    stubLocation((success) =>
      success({ coords: { latitude: 33.58031234, longitude: -7.63309876 } } as GeolocationPosition),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    expect(await screen.findByRole("heading", { level: 1, name: "Set up your workshop" })).toBeInTheDocument();
    expect(screen.getByText("You can add photos once your workshop is saved.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Workshop name"), "Garage Atlas Auto");
    await user.type(screen.getByLabelText("Inspection price"), "35O0");
    await user.type(screen.getByLabelText("Address"), "27 Rue Ibnou Mounir");
    expect(screen.getByLabelText("City")).toHaveValue("1");
    await user.click(screen.getByRole("button", { name: "Use my location" }));
    expect(screen.getByText("33.5803")).toBeInTheDocument();
    expect(screen.getByText("-7.6331")).toBeInTheDocument();

    await user.click(saveButton("Create workshop"));

    expect(await screen.findByRole("heading", { level: 1, name: "Workshop profile" })).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        name: "Garage Atlas Auto",
        inspectionPrice: 350,
        cityId: 1,
        address: "27 Rue Ibnou Mounir",
        latitude: 33.580312,
        longitude: -7.633099,
      },
    ]);
    expect(screen.getByRole("switch", { name: "Accept inspection requests" })).toBeChecked();
  });

  it("asks for the pin when the API says the position is missing", async () => {
    signIn();
    serveWorkshop(null);
    server.use(
      http.post("*/api/mechanics", () =>
        apiErrors(
          400,
          { code: "validation.required", message: "Required", field: "latitude" },
          { code: "validation.required", message: "Required", field: "longitude" },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    await screen.findByRole("heading", { level: 1, name: "Set up your workshop" });
    await user.click(saveButton("Create workshop"));

    expect(await screen.findByText("Place the pin on your workshop.")).toBeInTheDocument();
  });

  it("explains when the browser won't share the location", async () => {
    signIn();
    serveWorkshop(null);
    stubLocation((_success, failure) =>
      failure?.({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "" }),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    await user.click(await screen.findByRole("button", { name: "Use my location" }));

    expect(
      screen.getByText("Location access is blocked. Allow it in your browser, or place the pin on the map."),
    ).toBeInTheDocument();
  });

  it("places the pin where the map is clicked", async () => {
    signIn();
    serveWorkshop(null);
    const user = userEvent.setup();
    renderApp("/workshop");

    await user.click(await screen.findByRole("region", { name: "Map of your workshop's location" }));

    expect(await screen.findByRole("button", { name: "Your workshop. Use the arrow keys to move it." })).toBeInTheDocument();
    expect(screen.getByText("Click the map or drag the pin to your workshop entrance.")).toBeInTheDocument();
  });

  it("saves changed details, clears empty ones and moves the pin with the keyboard", async () => {
    signIn();
    const bodies = serveWorkshop(workshop());
    const user = userEvent.setup();
    renderApp("/workshop");

    const price = await screen.findByLabelText("Inspection price");
    expect(price).toHaveValue("350");
    await user.clear(price);
    await user.clear(screen.getByLabelText("Description"));
    const pin = screen.getByRole("button", { name: "Your workshop. Use the arrow keys to move it." });
    pin.focus();
    await user.keyboard("{ArrowUp}");
    await user.click(saveButton("Save changes"));

    expect(await screen.findAllByText("Changes saved.")).not.toHaveLength(0);
    expect(bodies).toEqual([
      expect.objectContaining({
        name: "Garage Atlas Auto",
        phone: "0661234567",
        inspectionPrice: null,
        description: null,
        longitude: -7.6331,
      }),
    ]);
    const [body] = bodies;
    expect(Object(body).latitude).toBeGreaterThan(33.5803);
  });

  it("stops accepting requests right away", async () => {
    signIn();
    const bodies = serveWorkshop(workshop());
    const user = userEvent.setup();
    renderApp("/workshop");

    expect(await screen.findByText("Accepting inspection requests")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Accept inspection requests" }));

    expect(await screen.findByText("Not accepting inspection requests")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Accept inspection requests" })).not.toBeChecked();
    expect(bodies).toEqual([{ isActive: false }]);
  });

  it("uploads garage photos and removes them", async () => {
    signIn();
    let photos: { id: number; link: string }[] = [];
    server.use(
      http.get("*/api/mechanics/me", () => HttpResponse.json({ mechanic: workshop({ garageImages: photos }) })),
      http.post("*/api/mechanics/me/garage-images", () => {
        photos = [{ id: 9, link: `${storageUrl}/garage-a.jpg` }];
        return HttpResponse.json(
          {
            garageImages: [
              {
                id: 9,
                filename: "garage-a.jpg",
                originalName: "lift.jpg",
                upload: { url: storageUrl, fields: { key: "garage-a.jpg", "Content-Type": "image/" } },
              },
            ],
          },
          { status: 201 },
        );
      }),
      http.post(storageUrl, () => storageResponse(204)),
      http.delete("*/api/mechanics/me/garage-images/9", () => {
        photos = [];
        return HttpResponse.json({ deleted: true, imageId: 9 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    expect(await screen.findByText("No photos yet.")).toBeInTheDocument();
    await user.upload(screen.getByLabelText("Add photos"), new File(["lift"], "lift.jpg", { type: "image/jpeg" }));

    const photo = await screen.findByRole("img", { name: "Garage photo 1" });
    expect(photo).toHaveAttribute("src", `${storageUrl}/garage-a.jpg`);
    expect(screen.getByText(/reception\. 1 of 12$/u)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));
    expect(await screen.findByText("No photos yet.")).toBeInTheDocument();
  });

  it("links mechanics to their workshop and keeps others out", async () => {
    signIn("seller");
    renderApp("/workshop");

    expect(await screen.findByRole("heading", { level: 1, name: "You can't open this page" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My workshop" })).not.toBeInTheDocument();
  });

  it("is in a mechanic's navigation", async () => {
    signIn();
    serveWorkshop(workshop());
    renderApp("/");

    const [header] = await screen.findAllByRole("navigation", { name: "Main navigation" });
    expect(await within(header ?? document.body).findByRole("link", { name: "My workshop" })).toHaveAttribute(
      "href",
      "/workshop",
    );
  });

  it("picks the city the pin is in", async () => {
    signIn();
    serveWorkshop(null);
    serveCityAreas();
    stubLocation((success) =>
      success({ coords: { latitude: 30.42, longitude: -9.59 } } as GeolocationPosition),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    const city = await screen.findByLabelText("City");
    await screen.findByRole("option", { name: "Agadir" });
    expect(city).toHaveValue("1");
    await user.click(screen.getByRole("button", { name: "Use my location" }));

    expect(city).toHaveValue("2");
    expect(screen.getByText("City set to Agadir, where the pin is.")).toBeInTheDocument();
    expect(screen.getByText("30.4200")).toBeInTheDocument();
  });

  it("refuses a pin outside every city", async () => {
    signIn();
    serveWorkshop(null);
    serveCityAreas();
    stubLocation((success) =>
      success({ coords: { latitude: 48.8566, longitude: 2.3522 } } as GeolocationPosition),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    await screen.findByRole("option", { name: "Agadir" });
    await user.click(screen.getByRole("button", { name: "Use my location" }));

    expect(
      screen.getByText("This spot isn't in a city on AutoSouk. Place the pin in your workshop's city."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Your workshop. Use the arrow keys to move it." })).not.toBeInTheDocument();
  });

  it("removes the pin when another city doesn't contain it", async () => {
    signIn();
    serveWorkshop(workshop());
    serveCityAreas();
    const user = userEvent.setup();
    renderApp("/workshop");

    expect(await screen.findByRole("button", { name: "Your workshop. Use the arrow keys to move it." })).toBeInTheDocument();
    await screen.findByRole("option", { name: "Agadir" });
    await user.selectOptions(screen.getByLabelText("City"), "2");

    expect(
      screen.getByText("The pin was outside this city, so it was removed. Place it on your workshop again."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Your workshop. Use the arrow keys to move it." })).not.toBeInTheDocument();
  });

  it("shows the API's message when the pin is outside the city", async () => {
    signIn();
    serveWorkshop(workshop());
    server.use(
      http.patch("*/api/mechanics/me", () =>
        apiErrors(400, {
          code: "mechanic.location_outside_city",
          message: "The pin is outside Casablanca. Move it into the city, or choose the city where your workshop is.",
          field: "latitude",
        }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/workshop");

    await screen.findByRole("heading", { level: 1, name: "Workshop profile" });
    await user.click(saveButton("Save changes"));

    expect(await screen.findByText(/The pin is outside Casablanca/u)).toBeInTheDocument();
  });

  it("reminds that a moved pin needs saving, under the map", async () => {
    signIn();
    const bodies = serveWorkshop(workshop());
    const user = userEvent.setup();
    renderApp("/workshop");

    await user.click(await screen.findByRole("region", { name: "Map of your workshop's location" }));
    expect(screen.getByText("Position not saved yet. Click the button to keep it.")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: "Save changes" });
    expect(buttons).toHaveLength(2);
    const underMap = buttons.at(-1);
    if (underMap) {
      await user.click(underMap);
    }

    expect(await screen.findAllByText("Changes saved.")).toHaveLength(2);
    expect(screen.queryByText("Position not saved yet. Click the button to keep it.")).not.toBeInTheDocument();
    expect(bodies).toHaveLength(1);
  });
});
