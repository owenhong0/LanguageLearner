import { describe, it, expect, beforeEach } from "vitest";
import { loadProgress, saveProgress, clearProgress } from "./store";

const KEY = "moshui.v1";

describe("store — progress persistence", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty progress on first visit (no stored data)", () => {
    expect(loadProgress()).toEqual({ known: [], vocabKnown: [], bonus: 0, practice: { answered: 0, correct: 0 } });
  });

  it("round-trips saved progress", () => {
    const p = { known: ["cmn:a"], vocabKnown: ["cmn:v-1", "jpn:v-2"], bonus: 5, practice: { answered: 4, correct: 3 } };
    saveProgress(p);
    expect(loadProgress()).toEqual(p);
  });

  it("falls back to empty on corrupt JSON", () => {
    localStorage.setItem(KEY, "{ not valid json");
    expect(loadProgress().practice).toEqual({ answered: 0, correct: 0 });
    expect(loadProgress().vocabKnown).toEqual([]);
  });

  it("normalizes a garbage / partial shape into valid fields", () => {
    localStorage.setItem(KEY, JSON.stringify({ known: "nope", bonus: -10, practice: { answered: "x" } }));
    const p = loadProgress();
    expect(p.known).toEqual([]); // non-array coerced
    expect(p.bonus).toBe(0); // negative coerced
    expect(p.practice).toEqual({ answered: 0, correct: 0 });
  });

  it("clamps correct to never exceed answered", () => {
    localStorage.setItem(KEY, JSON.stringify({ practice: { answered: 2, correct: 99 } }));
    expect(loadProgress().practice).toEqual({ answered: 2, correct: 2 });
  });

  it("drops non-string entries from the known arrays", () => {
    localStorage.setItem(KEY, JSON.stringify({ vocabKnown: ["cmn:v-1", 5, null, "jpn:v-2"] }));
    expect(loadProgress().vocabKnown).toEqual(["cmn:v-1", "jpn:v-2"]);
  });

  it("clearProgress removes stored data", () => {
    saveProgress({ known: ["cmn:a"], vocabKnown: [], bonus: 1, practice: { answered: 1, correct: 1 } });
    clearProgress();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(loadProgress().known).toEqual([]);
  });
});
