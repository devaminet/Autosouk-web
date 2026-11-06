import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import "../../../lib/i18n";
import { ListingActionsMenu } from "./ListingActionsMenu";

describe("ListingActionsMenu", () => {
  it("closes when the page scrolls, as the menu would drift from its button", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ListingActionsMenu onDelete={vi.fn()} title="My Golf" />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Actions for My Golf" }));
    expect(screen.getByRole("button", { name: "Delete listing" })).toBeInTheDocument();

    fireEvent.scroll(window);

    expect(screen.queryByRole("button", { name: "Delete listing" })).not.toBeInTheDocument();
  });
});
