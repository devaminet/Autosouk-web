import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/AppProviders";
import { ReasonDialog } from "./ReasonDialog";

const renderDialog = (onConfirm = vi.fn()) =>
  render(
    <AppProviders>
      <ReasonDialog
      confirmIcon="lock"
      confirmLabel="Suspend the account"
      consequences={["Signed out of every device now"]}
      description="The account keeps its data."
      error={null}
      helper="Sent to the user by email."
      isPending={false}
      label="Why are you suspending this account?"
      onClose={vi.fn()}
      onConfirm={onConfirm}
      open
      title="Suspend Hamid Mansouri?"
      />
    </AppProviders>,
  );

describe("ReasonDialog", () => {
  it("needs a reason, and sends it trimmed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    expect(await screen.findByRole("dialog", { name: "Suspend Hamid Mansouri?" })).toBeInTheDocument();
    expect(screen.getByText("Signed out of every device now")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Suspend the account" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText("Why are you suspending this account?"), "  Fake listings  ");
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith("Fake listings");
  });
});
