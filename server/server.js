import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const PORT = process.env.PORT || 8787;

// CORS — allow the deployed GitHub Pages origin plus local dev servers.
const ALLOWED_ORIGINS = [
  "https://owenhong0.github.io",
  "http://localhost:5173", // Vite dev
  "http://localhost:4173", // Vite preview
];

const app = express();
app.use(express.json({ limit: "256kb" }));
app.use(cors({ origin: ALLOWED_ORIGINS }));

// ---------------------------------------------------------------------------
// In-memory progress store (no DB, no auth). Keyed by `${deck}::${card}`.
// Resets whenever the process restarts — fine for a demo/free Render service.
// ---------------------------------------------------------------------------
const STATUSES = new Set(["known", "learning", "new"]);
/** @type {Map<string, { deck: string, card: string, status: string }>} */
const progress = new Map();

app.get("/health", (_req, res) => res.json({ ok: true }));

// POST /progress — accept and update one card's state.
app.post("/progress", (req, res) => {
  const { deck, card, status } = req.body ?? {};
  if (typeof deck !== "string" || typeof card !== "string" || !STATUSES.has(status)) {
    return res.status(400).json({
      error: "Body must be { deck: string, card: string, status: 'known' | 'learning' | 'new' }",
    });
  }
  progress.set(`${deck}::${card}`, { deck, card, status });
  res.json({ ok: true, entry: { deck, card, status } });
});

// GET /progress — summary: counts per status per deck, plus totals.
app.get("/progress", (_req, res) => {
  const decks = {};
  const totals = { known: 0, learning: 0, new: 0 };
  for (const { deck, status } of progress.values()) {
    decks[deck] ??= { known: 0, learning: 0, new: 0 };
    decks[deck][status] += 1;
    totals[status] += 1;
  }
  res.json({ decks, totals, cards: progress.size });
});

// ---------------------------------------------------------------------------
// Content generation via the Anthropic Messages API.
// ---------------------------------------------------------------------------
const TYPES = new Set(["vocab", "sentence", "reading", "structure", "verbs", "phrases"]);

/** Pull a JSON object out of a model response, tolerating code fences / stray prose. */
function parseJsonSafely(text) {
  if (typeof text !== "string") return null;
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Infer the language id from a free-text language name (fallback when langId omitted).
function inferLangId(language) {
  const l = String(language).toLowerCase();
  if (l.includes("japan") || l.includes("日")) return "jpn";
  if (l.includes("cantonese") || l.includes("粵") || l.includes("粤")) return "yue";
  return "cmn";
}

// Script ranges: Han (CJK ideographs) and Japanese kana.
const HAN = /[㐀-鿿豈-﫿]/;
const KANA = /[぀-ヿ]/;

/**
 * Reject content that isn't in the target language's script — this is what
 * catches the "asked for Mandarin, got Spanish" bug, since Latin-script output
 * contains no Han/kana at all.
 */
function scriptMatchesLanguage(items, langId) {
  const joined = items.map((i) => i.glyph).join("");
  if (!joined.trim()) return false;
  if (langId === "jpn") return KANA.test(joined) || HAN.test(joined);
  return HAN.test(joined); // cmn / yue → Han characters required
}

function buildPrompt(type, deck, difficulty, language, vocab) {
  const prefer =
    Array.isArray(vocab) && vocab.length
      ? ` Prioritize reusing words the learner already knows: ${vocab.slice(0, 24).join(", ")}.`
      : "";
  const constraint =
    `Generate ALL content EXCLUSIVELY in ${language}. ` +
    `Every "glyph" value MUST be written in ${language} using its native script — never Spanish, English, ` +
    `or any other language in "glyph". "roman" is the romanization; "gloss" is the English meaning/translation. ` +
    `Difficulty: ${difficulty}. Topic / deck: "${deck}".${prefer}`;
  const shape =
    `Return STRICT JSON only — no markdown, no code fences, no commentary — exactly: ` +
    `{"items":[{"glyph":"<${language} text>","roman":"<romanization>","gloss":"<English>"}]}.`;
  switch (type) {
    case "vocab":
      return `${constraint} Produce 6 useful ${language} vocabulary entries (glyph = word). ${shape}`;
    case "sentence":
      return `${constraint} Produce 5 short, natural ${language} sentences (roman = full-sentence romanization, gloss = English translation). ${shape}`;
    case "reading":
      return `${constraint} Produce one short ${language} reading passage of 4 lines; each line is one item (gloss = English translation). ${shape}`;
    case "structure":
      return `${constraint} Produce 4 common ${language} sentence-structure / grammar patterns. For each item, glyph = a complete example sentence in ${language}, roman = its romanization, gloss = "<pattern name> — <English translation>". ${shape}`;
    case "verbs":
      return `${constraint} Produce 5 common ${language} verbs shown in context. glyph = the verb used in a short phrase or sentence, roman = romanization, gloss = "<verb meaning> — <note on the form or aspect used>". ${shape}`;
    case "phrases":
      return `${constraint} Produce 5 common ${language} multi-word phrases or set expressions (glyph = the phrase). ${shape}`;
    default:
      return `${constraint} Produce 6 ${language} items. ${shape}`;
  }
}

// POST /generate — { type, deck, difficulty, language, langId } → { type, deck, difficulty, items }.
app.post("/generate", async (req, res) => {
  const { type, deck = "General", difficulty = "beginner", language, langId, vocab } = req.body ?? {};
  const vocabHints = Array.isArray(vocab) ? vocab.filter((v) => typeof v === "string") : undefined;
  if (!TYPES.has(type)) {
    return res.status(400).json({ error: "type must be 'vocab', 'sentence', or 'reading'" });
  }
  if (typeof language !== "string" || !language.trim()) {
    return res.status(400).json({ error: "language is required (e.g. 'Mandarin', 'Cantonese', 'Japanese')" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "Server is not configured: ANTHROPIC_API_KEY is missing" });
  }

  const targetLangId = typeof langId === "string" ? langId : inferLangId(language);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Generate, then validate the script; retry up to 3 times if the model drifts
  // to the wrong language before giving up.
  try {
    let lastRaw = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const reinforce =
        attempt === 0
          ? ""
          : ` Your previous response was NOT in ${language}. Output ONLY ${language} in every "glyph". Try again.`;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `You return only valid minified JSON. You generate content EXCLUSIVELY in ${language}; never output any other language in the "glyph" field.`,
        messages: [{ role: "user", content: buildPrompt(type, String(deck), String(difficulty), language, vocabHints) + reinforce }],
      });

      const text = message.content.find((b) => b.type === "text")?.text ?? "";
      lastRaw = text;
      const parsed = parseJsonSafely(text);
      if (!parsed || !Array.isArray(parsed.items)) continue;

      const items = parsed.items
        .filter((it) => it && typeof it.glyph === "string" && it.glyph.trim())
        .map((it) => ({
          glyph: String(it.glyph),
          roman: typeof it.roman === "string" ? it.roman : "",
          gloss: typeof it.gloss === "string" ? it.gloss : "",
        }));

      if (items.length && scriptMatchesLanguage(items, targetLangId)) {
        return res.json({ type, deck, difficulty, language, langId: targetLangId, items });
      }
    }
    return res.status(502).json({
      error: `Could not generate valid ${language} content after several attempts`,
      raw: lastRaw.slice(0, 500),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[/generate] failed:", detail);
    res.status(502).json({ error: "Generation failed", detail });
  }
});

app.listen(PORT, () => console.log(`Moshui server listening on :${PORT}`));
