/**
 * Shared types for the Kanji SRS app.
 *
 * Static content types mirror the shape of kanji.json / hiragana.json.
 * User state types extend ts-fsrs's Card and ReviewLog.
 */

import type { Card, ReviewLog } from 'ts-fsrs'

// ─── Deck Identifiers ───────────────────────────────────────────

export type DeckId = 'kanji' | 'hiragana'

// ─── Static content (kanji.json) ────────────────────────────────

export type Example = {
  word: string // "日本"
  reading: string // "にほん"
  meaning: string // "Japan"
}

export type KanjiEntry = {
  /** The character itself. Primary key. */
  char: string // "日"
  /** Unicode codepoint, lowercase hex — used to look up KanjiVG paths. */
  codepoint: string // "065e5"
  meanings: string[]
  onyomi: string[]
  kunyomi: string[]
  strokeCount: number
  jlpt: 5
  grade: number | null
  frequency: number | null
  examples: Example[]
}

/** kanji.json is keyed by character for O(1) lookup. */
export type KanjiDictionary = Record<string, KanjiEntry>

// ─── Static content (hiragana.json) ─────────────────────────────

export type HiraganaCategory = 'gojuon' | 'dakuon' | 'handakuon' | 'yoon'

export type HiraganaGroup =
  | 'a-row'
  | 'ka-row'
  | 'sa-row'
  | 'ta-row'
  | 'na-row'
  | 'ha-row'
  | 'ma-row'
  | 'ya-row'
  | 'ra-row'
  | 'wa-row'
  | 'n'
  | 'dakuon'
  | 'handakuon'
  | 'yoon'

export type HiraganaEntry = {
  /** Primary character, e.g. "あ" or "きゃ" */
  char: string
  /** Primary romaji representation, e.g. "a" or "kya" */
  romaji: string
  /** Valid alternative romaji spellings accepted by wanakana */
  altRomaji?: string[]
  /** Categorization for filtering and grid layout */
  category: HiraganaCategory
  /** Row group for syllabary chart positioning */
  group: HiraganaGroup
  /** Column position in 5x10 grid (0=a, 1=i, 2=u, 3=e, 4=o, null for n/yoon) */
  gridCol?: number | null
  /** Row position in 5x10 grid (0=a-row, 1=ka-row, ..., 9=wa-row; null for n/yoon) */
  gridRow?: number | null
  /** Short visual/mnemonic memory aid */
  mnemonic?: string
  /** 2–3 N5 example words featuring this hiragana */
  examples: Example[]
  /** Unicode codepoint identifier for stroke order animation (lowercase hex) */
  codepoint: string
}

/** Discriminated union for deck-agnostic card display. */
export type DeckEntry = KanjiEntry | HiraganaEntry

/** Type guard: is this a HiraganaEntry? */
export function isHiraganaEntry(entry: DeckEntry): entry is HiraganaEntry {
  return 'romaji' in entry && 'category' in entry
}

/** Type guard: is this a KanjiEntry? */
export function isKanjiEntry(entry: DeckEntry): entry is KanjiEntry {
  return 'meanings' in entry && 'onyomi' in entry
}

// ─── User state (persisted to localStorage) ─────────────────────

/** A review log entry tagged with the character and deck. */
export type ReviewEntry = ReviewLog & {
  char: string
  /** Required deck tag; backfilled to 'kanji' during v1→v2 migration. */
  deckId: DeckId
}

export type AnswerInputMode = 'romaji' | 'disabled'

export type Settings = {
  newCardsPerDay: number // default 5
  maxReviewsPerDay: number // default 100, 0 = unlimited
  theme: 'light' | 'dark' | 'system'
  requestRetention: number // FSRS target, default 0.9
  answerInputMode: AnswerInputMode
  /** Active deck selection, persisted across reloads. */
  activeDeck: DeckId
}

export type AnswerFeedback = {
  userTyped: string
  isCorrect: boolean
  /** For kanji: 'onyomi' | 'kunyomi'. For hiragana: 'hiragana'. */
  matchedType?: 'onyomi' | 'kunyomi' | 'hiragana'
  matchedReading?: string
}

export type ProgressState = {
  /** "deckId:char" → FSRS card state. Absent key = never studied ("new"). */
  cards: Record<string, Card>
  /** Append-only. The source of truth for all stats. */
  log: ReviewEntry[]
  settings: Settings
  /** Schema version, for future migrations. */
  version: number
}
