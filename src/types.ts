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

/** One line of a reading passage; tap reveals reading + translation and plays audio. */
export interface ReadingLine {
  glyph: string;
  roman: string;
  translation: string;
}

/** Optional comprehension check shown under a passage. */
export interface PassageQuestion {
  ask: string; // the question, in English
  opts: string[]; // answer choices
  a: number; // index of the correct choice in `opts`
}

export interface Passage {
  id: string;
  kind: string; // "News" | "Story"
  title: ReadingLine;
  lines: ReadingLine[];
  question?: PassageQuestion;
}

/** How romanization (pinyin / jyutping / rōmaji) is displayed, app-wide (T6). */
export type RomanPref = "reveal" | "always" | "off";

/** A word-order / grammar pattern shown in the Build section. */
export interface GrammarPattern {
  name: string; // e.g. "Subject–Verb–Object"
  template: string; // slots, e.g. "[主语] + [动词] + [宾语]"
  example: Example; // a complete sentence built from known vocab
}

/** A verb or phrase entry for the Build section (rendered via VocabCard). */
export interface BuildItem {
  glyph: string;
  roman: string;
  meaning: string;
  example?: Example;
}

/** Curated grammar / verbs / phrases for the Build section, per language. */
export interface BuildContent {
  patterns: GrammarPattern[];
  verbs: BuildItem[];
  phrases: BuildItem[];
}

export interface QuizOption {
  glyph: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

/** The CJK character that labels each section, per script (讀/读/読 …). */
export interface SectionMarks {
  reading: string;
  practice: string;
  progress: string;
}

export interface LangContent {
  id: LangId;
  pill: string;
  name: string;
  speechLang: string;
  romanSystem: string;
  marks: SectionMarks;
  greeting: { glyph: string; roman: string; meaning: string };
  hero: Card;
  review: Card[];
  tone: { title: string; items: Tone[] };
  vocabulary: VocabItem[];
  converse: ConverseSeed;
  reading: { passages: Passage[] };
  practice: { questions: QuizQuestion[] };
  build: BuildContent;
}
