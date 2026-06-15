import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchProgress, postProgress, generateContent } from "./api";

afterEach(() => vi.unstubAllGlobals());

const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data });

describe("api — Render backend client", () => {
  it("fetchProgress GETs /progress and returns the summary", async () => {
    const summary = { decks: {}, totals: { known: 0, learning: 0, new: 0 }, cards: 0 };
    const f = vi.fn().mockResolvedValue(ok(summary));
    vi.stubGlobal("fetch", f);
    expect(await fetchProgress()).toEqual(summary);
    expect(String(f.mock.calls[0][0])).toMatch(/\/progress$/);
  });

  it("fetchProgress throws when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) }));
    await expect(fetchProgress()).rejects.toThrow();
  });

  it("postProgress POSTs the card state", async () => {
    const f = vi.fn().mockResolvedValue(ok({ ok: true }));
    vi.stubGlobal("fetch", f);
    await postProgress("Greetings", "v-nihao", "known");
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toMatch(/\/progress$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ deck: "Greetings", card: "v-nihao", status: "known" });
  });

  it("generateContent POSTs { type, deck, difficulty } and returns items", async () => {
    const result = { type: "vocab", deck: "Food", difficulty: "beginner", items: [{ glyph: "水", roman: "shuǐ", gloss: "water" }] };
    const f = vi.fn().mockResolvedValue(ok(result));
    vi.stubGlobal("fetch", f);
    expect(await generateContent("vocab", "Food", "beginner")).toEqual(result);
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toMatch(/\/generate$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ type: "vocab", deck: "Food", difficulty: "beginner" });
  });

  it("generateContent surfaces the server's error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: "Model did not return JSON" }) }));
    await expect(generateContent("vocab", "Food", "beginner")).rejects.toThrow(/did not return JSON/);
  });
});
