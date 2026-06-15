import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// Each test starts from a clean browser-storage slate (T2 persistence).
beforeEach(() => localStorage.clear());

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

describe("progress persistence (T2)", () => {
  beforeEach(() => localStorage.clear());

  const gotoProgress = async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Progress" }));
    return user;
  };

  it("hydrates a persisted quiz tally from localStorage", async () => {
    localStorage.setItem(
      "moshui.v1",
      JSON.stringify({ known: [], vocabKnown: [], bonus: 0, practice: { answered: 4, correct: 3 } }),
    );
    await gotoProgress();
    // 3 / 4 = 75% accuracy ring.
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("shows no accuracy on a clean first visit", async () => {
    await gotoProgress();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("resets progress after the two-step confirm and clears storage", async () => {
    localStorage.setItem(
      "moshui.v1",
      JSON.stringify({ known: [], vocabKnown: [], bonus: 0, practice: { answered: 4, correct: 3 } }),
    );
    const user = await gotoProgress();
    expect(screen.getByText("75%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset progress/i }));
    await user.click(screen.getByRole("button", { name: /reset everything/i }));

    // Accuracy falls back to the empty state and storage is wiped.
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("moshui.v1")!).practice).toEqual({ answered: 0, correct: 0 });
  });
});

describe("spaced repetition (T3)", () => {
  beforeEach(() => localStorage.clear());

  // Mandarin review-deck card keys.
  const CMN = ["cmn:ni-hao", "cmn:xiexie", "cmn:chifan", "cmn:shui"];

  it("shows every card as due on a clean start", () => {
    render(<App />);
    expect(screen.getByText(`${CMN.length} due`)).toBeInTheDocument();
  });

  it("hydrates Leitner boxes and surfaces only due cards in Review mode", async () => {
    const user = userEvent.setup();
    // All but one card mastered (box 5); 'shui' left at box 2 → 1 due.
    const boxes = { "cmn:ni-hao": 5, "cmn:xiexie": 5, "cmn:chifan": 5, "cmn:shui": 2 };
    localStorage.setItem("moshui.v1", JSON.stringify({ known: [], vocabKnown: [], bonus: 0, practice: { answered: 0, correct: 0 }, boxes }));
    render(<App />);
    expect(screen.getByText("1 due")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Due for review" }));
    // Only the one due card renders in Review mode.
    expect(screen.getAllByRole("button", { name: /^Card:/ })).toHaveLength(1);
  });

  it("promotes a card's box when graded 'Got it'", async () => {
    const user = userEvent.setup();
    render(<App />);
    const firstCard = screen.getAllByRole("button", { name: /^Card:/ })[0];
    await user.click(firstCard); // flip to reveal grading controls
    await user.click(screen.getAllByRole("button", { name: /Got it/ })[0]);
    // One card has advanced from box 1 → box 2.
    expect(screen.getAllByLabelText(/Leitner box 2 of 5/).length).toBeGreaterThan(0);
  });
});
