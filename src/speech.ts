/**
 * Speak a CJK string using the browser's built-in speech synthesis.
 * Voice availability depends on the languages installed on the user's OS;
 * if speech is unsupported we fail silently rather than throwing.
 */
export function speak(text: string, lang: string): void {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.82;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unsupported — honest silent fallback */
  }
}
