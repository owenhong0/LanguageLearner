import "@testing-library/jest-dom/vitest";

// jsdom has no Web Speech APIs. The app already feature-detects them, but we
// stub speechSynthesis so audio buttons can be exercised without throwing.
if (!("speechSynthesis" in window)) {
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      speak: () => {},
      cancel: () => {},
      getVoices: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
}
if (!("SpeechSynthesisUtterance" in window)) {
  // Minimal constructor so new SpeechSynthesisUtterance(text) works in tests.
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    class {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: unknown = null;
      constructor(text: string) {
        this.text = text;
      }
    };
}
