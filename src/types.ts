export type LangId = "yue" | "cmn" | "jpn";

export interface Example {
  glyph: string;
  roman: string;
  gloss: string;
}

export interface Card {
  id: string;
  glyph: string;
  roman: string;
  meaning: string;
  anchor: string;
  example: Example;
}

export interface Tone {
  label: string;
  glyph: string;
  roman: string;
  gloss: string;
  /** polyline points for a 64x40 viewBox; lower y = higher pitch */
  points: string;
}

/** A vocabulary entry with a spaced-repetition level (0 = new … 5 = mastered). */
export interface VocabItem {
  id: string;
  glyph: string;
  roman: string;
  meaning: string;
  deck: string;
  anchor: string;
  example: Example;
  srs: number;
}

/** One line of dialogue, used for tutor openers, learner turns and suggestions. */
export interface ChatLine {
  glyph: string;
  roman: string;
  translation: string;
  /** Optional gentle correction shown as a jade note under a tutor bubble. */
  feedback?: string;
}

export interface Scenario {
  id: string;
  label: string;
  opener: ChatLine;
}

export interface ConverseSeed {
  scenarios: Scenario[];
  suggestions: ChatLine[];
  /** Scripted tutor turns cycled through as the learner replies. */
  followups: ChatLine[];
}

export interface LangContent {
  id: LangId;
  pill: string;
  name: string;
  speechLang: string;
  romanSystem: string;
  greeting: { glyph: string; roman: string; meaning: string };
  hero: Card;
  review: Card[];
  tone: { title: string; items: Tone[] };
  vocabulary: VocabItem[];
  converse: ConverseSeed;
}
