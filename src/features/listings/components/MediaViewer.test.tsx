import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import "../../../lib/i18n";
import { testMedia } from "../../../test/fixtures";
import { MediaViewer } from "./MediaViewer";

const media = [testMedia(1), testMedia(2), testMedia(3, { type: "video" })];

function Viewer({ start }: { start: number }) {
  const [index, setIndex] = useState<number | null>(start);
  return <MediaViewer index={index} media={media} onClose={() => setIndex(null)} onIndexChange={setIndex} title="My Golf" />;
}

type User = ReturnType<typeof userEvent.setup>;

// A one-finger drag on the element, from one point to another.
const swipe = (user: User, target: Element, from: [number, number], to: [number, number]) =>
  user.pointer([
    { keys: "[TouchA>]", target, coords: { clientX: from[0], clientY: from[1] } },
    { pointerName: "TouchA", target, coords: { clientX: to[0], clientY: to[1] } },
    { keys: "[/TouchA]", target, coords: { clientX: to[0], clientY: to[1] } },
  ]);

describe("MediaViewer", () => {
  it("shows the next item on a swipe to the left, and the previous one on a swipe to the right", async () => {
    const user = userEvent.setup();
    render(<Viewer start={0} />);

    await swipe(user, await screen.findByRole("img", { name: "Photo 1" }), [300, 200], [100, 210]);
    expect(screen.getByRole("img", { name: "Photo 2" })).toBeInTheDocument();

    await swipe(user, screen.getByRole("img", { name: "Photo 2" }), [100, 200], [300, 190]);
    expect(screen.getByRole("img", { name: "Photo 1" })).toBeInTheDocument();
  });

  it("ignores short and mostly vertical drags", async () => {
    const user = userEvent.setup();
    render(<Viewer start={0} />);

    const photo = await screen.findByRole("img", { name: "Photo 1" });
    await swipe(user, photo, [200, 200], [170, 200]);
    await swipe(user, photo, [200, 100], [140, 400]);

    expect(screen.getByRole("img", { name: "Photo 1" })).toBeInTheDocument();
  });

  it("leaves drags on a video's controls to the video", async () => {
    const user = userEvent.setup();
    render(<Viewer start={2} />);

    // jsdom lays nothing out, so the video's bottom edge is at 0 and any point is on its controls.
    await swipe(user, await screen.findByLabelText("Video 3"), [300, 0], [100, 0]);

    expect(screen.getByLabelText("Video 3")).toBeInTheDocument();
  });
});
