import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

/**
 * These tests guard against the "blank screen on load" regression: if the app
 * fails to mount, every assertion below fails. They also confirm the three new
 * screens (Reading / Practice / Progress) render when their tab is selected.
 */
describe("App loads and renders", () => {
  it("mounts without crashing and shows the header + nav", () => {
    render(<App />);
    // The sticky top bar is a <header> (banner) — proves the app mounted.
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // The top nav exposes all six tabs as buttons.
    for (const tab of ["Home", "Converse", "Vocabulary", "Reading", "Practice", "Progress"]) {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
    }
  });

  it("renders Home content by default (not a blank screen)", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /character of the day/i })).toBeInTheDocument();
    // A hero greeting heading proves the main content tree rendered.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("switches to the Reading screen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Reading" }));
    expect(screen.getByRole("heading", { name: "Reading" })).toBeInTheDocument();
    // Passage picker is present.
    expect(screen.getByRole("group", { name: /choose a passage/i })).toBeInTheDocument();
  });

  it("switches to the Practice screen and renders a quiz", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Practice" }));
    expect(screen.getByRole("heading", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /quick quiz/i })).toBeInTheDocument();
  });

  it("switches to the Progress screen and shows deck mastery", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Progress" }));
    expect(screen.getByRole("heading", { name: "Progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /deck mastery/i })).toBeInTheDocument();
  });

  it("re-themes content when a different language is selected", async () => {
    const user = userEvent.setup();
    render(<App />);
    const pills = screen.getByRole("group", { name: /language/i });
    await user.click(within(pills).getByRole("button", { name: /japanese/i }));
    // Japanese uses Rōmaji as its romanization system; it appears in the UI.
    expect(await screen.findAllByText(/rōmaji/i)).not.toHaveLength(0);
  });
});
