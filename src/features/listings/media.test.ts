import { describe, expect, it } from "vitest";
import { checkFiles, mediaKind, uniqueNames } from "./media";

const file = (name: string, size = 1000) => new File([new Uint8Array(size)], name);

describe("mediaKind", () => {
  it("reads the kind from the extension, ignoring case", () => {
    expect(mediaKind("front.JPG")).toBe("image");
    expect(mediaKind("tour.mp4")).toBe("video");
    expect(mediaKind("notes.pdf")).toBeNull();
    expect(mediaKind("noextension")).toBeNull();
  });
});

describe("checkFiles", () => {
  it("refuses unknown types, large files and files over the limit", () => {
    const { accepted, refused } = checkFiles(
      [file("a.png"), file("b.gif"), file("c.jpg", 11 * 1024 * 1024), file("d.webp"), file("e.mp4")],
      2,
    );

    expect(accepted.map(({ name }) => name)).toEqual(["a.png", "d.webp"]);
    expect(refused).toEqual([
      { name: "b.gif", reason: "type" },
      { name: "c.jpg", reason: "size" },
      { name: "e.mp4", reason: "limit" },
    ]);
  });
});

describe("uniqueNames", () => {
  it("numbers repeated names and keeps the extension", () => {
    expect(uniqueNames(["car.jpg", "CAR.jpg", "car.jpg", "side.png"])).toEqual([
      "car.jpg",
      "CAR-2.jpg",
      "car-3.jpg",
      "side.png",
    ]);
  });
});
