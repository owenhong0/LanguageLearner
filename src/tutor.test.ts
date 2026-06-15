import { describe, it, expect, vi, afterEach } from "vitest";
import { askTutor, isLiveTutorConfigured } from "./tutor";
import { CONTENT } from "./content";

const c = CONTENT.cmn;
const history = [{ role: "learner" as const, text: "我想喝茶。" }];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("tutor — live proxy client", () => {
  it("is not configured and returns null when the proxy URL is unset", async () => {
    vi.stubEnv("VITE_TUTOR_PROXY_URL", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(isLiveTutorConfigured()).toBe(false);
    expect(await askTutor(c, "Order tea", history)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the conversation and maps a valid reply to a ChatLine", async () => {
    vi.stubEnv("VITE_TUTOR_PROXY_URL", "https://proxy.example.com");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ native: "要哪种茶？", roman: "yào nǎ zhǒng chá?", en: "Which kind of tea?", feedback: "Good!" }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    expect(isLiveTutorConfigured()).toBe(true);
    const reply = await askTutor(c, "Order tea", history);
    expect(reply).toEqual({ glyph: "要哪种茶？", roman: "yào nǎ zhǒng chá?", translation: "Which kind of tea?", feedback: "Good!" });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://proxy.example.com");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ langId: "cmn", scenario: "Order tea" });
  });

  it("returns null on a non-OK response", async () => {
    vi.stubEnv("VITE_TUTOR_PROXY_URL", "https://proxy.example.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await askTutor(c, "Order tea", history)).toBeNull();
  });

  it("returns null when the reply is missing required fields", async () => {
    vi.stubEnv("VITE_TUTOR_PROXY_URL", "https://proxy.example.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ native: "x" }) }));
    expect(await askTutor(c, "Order tea", history)).toBeNull();
  });

  it("returns null when the request throws (proxy unreachable)", async () => {
    vi.stubEnv("VITE_TUTOR_PROXY_URL", "https://proxy.example.com");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await askTutor(c, "Order tea", history)).toBeNull();
  });
});
