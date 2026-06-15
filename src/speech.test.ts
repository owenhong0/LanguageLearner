import { describe, it, expect } from "vitest";
import { pickVoice } from "./speech";

// Build a synthetic voice; the real SpeechSynthesisVoice isn't available in jsdom.
const v = (name: string, lang: string, localService = true): SpeechSynthesisVoice =>
  ({ name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice);

describe("pickVoice — per-language voice selection", () => {
  it("returns null when no voices are installed", () => {
    expect(pickVoice([], "zh-CN")).toBeNull();
  });

  it("prefers a known native Mandarin voice by name", () => {
    const voices = [v("Daniel", "en-GB"), v("Tingting", "zh-CN"), v("Generic", "zh-CN")];
    expect(pickVoice(voices, "zh-CN")?.name).toBe("Tingting");
  });

  it("picks a Cantonese voice over a Mandarin one for zh-HK", () => {
    const voices = [v("Tingting", "zh-CN"), v("Sinji", "zh-HK")];
    expect(pickVoice(voices, "zh-HK")?.name).toBe("Sinji");
  });

  it("matches the yue-* tag for Cantonese when no zh-HK voice exists", () => {
    const voices = [v("Tingting", "zh-CN"), v("CantoVoice", "yue-Hant-HK")];
    expect(pickVoice(voices, "zh-HK")?.name).toBe("CantoVoice");
  });

  it("picks a Japanese voice by name", () => {
    const voices = [v("Alex", "en-US"), v("Kyoko", "ja-JP")];
    expect(pickVoice(voices, "ja-JP")?.name).toBe("Kyoko");
  });

  it("falls back to an exact lang tag when no preferred name matches", () => {
    const voices = [v("SomeVoice", "zh-CN"), v("English", "en-US")];
    expect(pickVoice(voices, "zh-CN")?.name).toBe("SomeVoice");
  });

  it("falls back to the primary subtag (any zh-*) as a last resort", () => {
    const voices = [v("TaiwanVoice", "zh-TW"), v("English", "en-US")];
    expect(pickVoice(voices, "zh-CN")?.name).toBe("TaiwanVoice");
  });

  it("prefers an on-device (localService) voice over a remote one in the same tier", () => {
    const remote = v("Remote", "ja-JP", false);
    const local = v("Local", "ja-JP", true);
    expect(pickVoice([remote, local], "ja-JP")?.name).toBe("Local");
  });

  it("never returns an unrelated-language voice", () => {
    const voices = [v("Alex", "en-US"), v("Thomas", "fr-FR")];
    expect(pickVoice(voices, "zh-CN")).toBeNull();
  });
});
