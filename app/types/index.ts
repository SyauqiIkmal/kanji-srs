/**
 * Shared types for the Kanji SRS app.
 *
 * Static content types mirror the shape of kanji.json.
 * User state types extend ts-fsrs's Card and ReviewLog.
 */

import type { Card, ReviewLog } from 'ts-fsrs'

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

// ─── User state (persisted to localStorage) ─────────────────────

/** A review log entry tagged with the kanji character. */
export type ReviewEntry = ReviewLog & {
  char: string
}

export type AnswerInputMode = 'romaji' | 'disabled'

export type Settings = {
  newCardsPerDay: number // default 5
  maxReviewsPerDay: number // default 100, 0 = unlimited
  theme: 'light' | 'dark' | 'system'
  requestRetention: number // FSRS target, default 0.9
  answerInputMode: AnswerInputMode
}

export type AnswerFeedback = {
  userTyped: string
  isCorrect: boolean
  matchedType?: 'onyomi' | 'kunyomi'
  matchedReading?: string
}

export type ProgressState = {
  /** char → FSRS card state. Absent key = never studied ("new"). */
  cards: Record<string, Card>
  /** Append-only. The source of truth for all stats. */
  log: ReviewEntry[]
  settings: Settings
  /** Schema version, for future migrations. */
  version: number
}
