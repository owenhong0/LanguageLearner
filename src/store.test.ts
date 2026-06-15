import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  clearProgress,
  boxLevel,
  promoteBox,
  demoteBox,
  isDue,
  BOX_MAX,
} from "./store";

const KEY = "moshui.v1";

describe("store — progress persistence", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty progress on first visit (no stored data)", () => {
    expect(loadProgress()).toEqual({ known: [], vocabKnown: [], bonus: 0, practice: { answered: 0, correct: 0 }, boxes: {} });
  });

  it("round-trips saved progress", () => {
    const p = { known: ["cmn:a"], vocabKnown: ["cmn:v-1", "jpn:v-2"], bonus: 5, practice: { answered: 4, correct: 3 }, boxes: { "cmn:a": 3 } };
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
    saveProgress({ known: ["cmn:a"], vocabKnown: [], bonus: 1, practice: { answered: 1, correct: 1 }, boxes: { "cmn:a": 2 } });
    clearProgress();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(loadProgress().known).toEqual([]);
    expect(loadProgress().boxes).toEqual({});
  });

  it("clamps stored box levels into the 1..5 range and drops non-numbers", () => {
    localStorage.setItem(KEY, JSON.stringify({ boxes: { a: 0, b: 9, c: 3, d: "x" } }));
    expect(loadProgress().boxes).toEqual({ a: 1, b: 5, c: 3 });
  });
});

describe("store — Leitner scheduling helpers", () => {
  it("defaults unseen cards to box 1", () => {
    expect(boxLevel({}, "cmn:ni-hao")).toBe(1);
    expect(boxLevel({ "cmn:ni-hao": 4 }, "cmn:ni-hao")).toBe(4);
  });

  it("promotes one box on correct recall, capped at the top box", () => {
    expect(promoteBox(1)).toBe(2);
    expect(promoteBox(4)).toBe(BOX_MAX);
    expect(promoteBox(BOX_MAX)).toBe(BOX_MAX);
  });

  it("demotes to box 1 when forgotten", () => {
    expect(demoteBox()).toBe(1);
  });

  it("treats a card as due until it reaches the top box", () => {
    expect(isDue(1)).toBe(true);
    expect(isDue(4)).toBe(true);
    expect(isDue(BOX_MAX)).toBe(false);
  });
});
