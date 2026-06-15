/**
 * Per-language speech playback for Moshui.
 *
 * The browser's default voice for an utterance is whatever the OS picks for the
 * `lang` tag — which is often a wrong or robotic fallback (e.g. an English voice
 * trying to read 漢字). This module instead selects the best *native* installed
 * voice for each language, handles the fact that voices load asynchronously, and
 * tunes the speaking rate per language so learners hear a clear model.
 */

export interface VoiceProfile {
  /** BCP-47 tags to match against `voice.lang`, best first. */
  langs: string[];
  /** Voice-name fragments to prefer (case-insensitive), best first. */
  preferred: string[];
  /** Speaking rate — CJK benefits from a slightly slower pace. */
  rate: number;
}

/**
 * Profiles keyed by the `speechLang` values used in content.ts. Preferred names
 * cover the common macOS / Windows / Google (Chrome OS, Android, ChromeTTS)
 * voices for each language; matching is "contains", so localized names work too.
 */
export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  // Mandarin
  "zh-CN": {
    langs: ["zh-CN", "zh-Hans-CN", "zh-Hans", "cmn-Hans-CN", "zh"],
    preferred: ["Tingting", "Ting-Ting", "Meijia", "Mei-Jia", "Huihui", "Yaoyao", "Kangkang", "普通话", "Google 普通话"],
    rate: 0.85,
  },
  // Cantonese
  "zh-HK": {
    langs: ["zh-HK", "yue-HK", "yue-Hant-HK", "yue", "zh-Hant-HK", "zh-Hant"],
    preferred: ["Sinji", "Sin-ji", "Tracy", "Danny", "粵語", "粤语", "Google 粵語", "Cantonese"],
    rate: 0.85,
  },
  // Japanese
  "ja-JP": {
    langs: ["ja-JP", "ja"],
    preferred: ["Kyoko", "O-ren", "Oren", "Nanami", "Ayumi", "Haruka", "日本語", "Google 日本語"],
    rate: 0.95,
  },
};

const norm = (s: string) => s.toLowerCase().replace(/_/g, "-");

/**
 * Pure voice-selection logic, exported for testing. Given the available voices
 * and a target `speechLang`, returns the best match or null.
 *
 * Priority: preferred voice name → exact lang tag → language prefix (e.g. "zh").
 * Within each tier a `localService` (on-device, higher quality, offline) voice
 * wins over a remote one.
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  speechLang: string,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const profile = VOICE_PROFILES[speechLang] ?? {
    langs: [speechLang],
    preferred: [],
    rate: 0.9,
  };

  const localFirst = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) =>
    Number(b.localService) - Number(a.localService);

  // 1. Preferred voice by name.
  const byName = voices
    .filter((v) => profile.preferred.some((p) => norm(v.name).includes(norm(p))))
    .sort(localFirst);
  if (byName.length) return byName[0];

  // 2. Exact lang-tag match, in profile order.
  for (const tag of profile.langs) {
    const exact = voices.filter((v) => norm(v.lang) === norm(tag)).sort(localFirst);
    if (exact.length) return exact[0];
  }

  // 3. Primary-subtag match (e.g. any "zh-*" for a "zh-CN" target).
  const primary = norm(profile.langs[0]).split("-")[0];
  const byPrefix = voices.filter((v) => norm(v.lang).split("-")[0] === primary).sort(localFirst);
  if (byPrefix.length) return byPrefix[0];

  return null;
}

// --- voice cache (voices populate asynchronously after `voiceschanged`) ---

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) cachedVoices = v;
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  // Voices are not guaranteed on first call; refresh when the list arrives.
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

/**
 * Speak a string in the given language using the best available native voice.
 * Voice availability depends on the languages installed on the user's OS; if
 * speech is unsupported we fail silently rather than throwing.
 */
export function speak(text: string, speechLang: string): void {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text) return;

    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;

    const profile = VOICE_PROFILES[speechLang];
    if (profile) u.rate = profile.rate;

    const voice = pickVoice(refreshVoices(), speechLang);
    if (voice) u.voice = voice;

    synth.cancel(); // stop any in-flight utterance so taps feel responsive
    synth.speak(u);
  } catch {
    /* speech unsupported — honest silent fallback */
  }
}
