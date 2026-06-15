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
    expect(screen.getAllByRole("button", { name: /^Flashcard/ })).toHaveLength(1);
  });

  it("promotes a card's box when graded 'Got it'", async () => {
    const user = userEvent.setup();
    render(<App />);
    const firstCard = screen.getAllByRole("button", { name: /^Flashcard/ })[0];
    await user.click(firstCard); // flip to reveal grading controls
    await user.click(screen.getAllByRole("button", { name: /^Got/ })[0]);
    // One card has advanced from box 1 → box 2.
    expect(screen.getAllByLabelText(/Leitner box 2 of 5/).length).toBeGreaterThan(0);
  });
});

describe("accessibility (T4)", () => {
  beforeEach(() => localStorage.clear());

  it("flip cards are real buttons that expose and toggle aria-expanded", async () => {
    const user = userEvent.setup();
    render(<App />);
    const front = screen.getAllByRole("button", { name: /^Flashcard/ })[0];
    expect(front).toHaveAttribute("aria-expanded", "false");
    await user.click(front);
    // The now-visible back control reports the expanded state.
    expect(screen.getAllByRole("button", { name: /Show character/ })[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the turned-away card back out of the accessibility tree until flipped", async () => {
    const user = userEvent.setup();
    render(<App />);
    // Grading controls live on the back, which is aria-hidden while showing the front.
    expect(screen.queryByRole("button", { name: /^Got/ })).toBeNull();
    await user.click(screen.getAllByRole("button", { name: /^Flashcard/ })[0]);
    expect(screen.getAllByRole("button", { name: /^Got/ }).length).toBeGreaterThan(0);
  });

  it("labels the Reading line reveal and play controls with their target", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Reading" }));
    // Reveal toggle names the line text + action and exposes aria-expanded.
    const reveal = screen.getAllByRole("button", { name: /show reading and translation/i })[0];
    expect(reveal).toHaveAttribute("aria-expanded", "false");
    // Each line has a play control naming the line.
    expect(screen.getAllByRole("button", { name: /^Play line:/ }).length).toBeGreaterThan(0);
  });
});

describe("reading expansion + romanization preference (T6)", () => {
  beforeEach(() => localStorage.clear());

  const gotoReading = async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Reading" }));
    return user;
  };

  it("hides romanization until tapped by default, and 'Always on' reveals it app-wide", async () => {
    const user = await gotoReading();
    const firstLineRoman = /jīn tiān tiān qì hěn hǎo/;
    // Default "reveal": line romanization is not shown until the line is tapped.
    expect(screen.queryByText(firstLineRoman)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Always on" }));
    expect(screen.getByText(firstLineRoman)).toBeInTheDocument();
    // "Off" hides romanization entirely (including the passage title reading).
    await user.click(screen.getByRole("button", { name: "Off" }));
    expect(screen.queryByText(firstLineRoman)).toBeNull();
    expect(screen.queryByText(/jīn tiān tiān qì$/)).toBeNull();
  });

  it("offers the new graded passages with a comprehension question", async () => {
    const user = await gotoReading();
    // A newly added passage is selectable…
    await user.click(screen.getByRole("button", { name: /Weekend activities/ }));
    // …and shows a comprehension question.
    expect(screen.getByText("How much is a ticket?")).toBeInTheDocument();
    // Picking the right answer is confirmed; a wrong pick would say otherwise.
    await user.click(screen.getByRole("button", { name: /20 yuan/ }));
    expect(screen.getByText("Correct")).toBeInTheDocument();
  });

  it("persists the romanization preference across reloads", async () => {
    const user = await gotoReading();
    await user.click(screen.getByRole("button", { name: "Off" }));
    expect(JSON.parse(localStorage.getItem("moshui.v1")!).romanPref).toBe("off");
  });
});
