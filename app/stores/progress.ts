/**
 * Progress store — the user's SRS state across all decks.
 *
 * Persisted to localStorage via pinia-plugin-persistedstate.
 * Uses ts-fsrs for scheduling; stores its Card type verbatim.
 *
 * Card keys are namespaced as "deckId:char" (e.g. "kanji:日", "hiragana:あ").
 * Schema version 2 introduces this namespacing; v1 keys are migrated on load.
 *
 * @see docs/DATA-MODEL.md
 * @see docs/adr/0001-use-fsrs-over-sm2.md
 * @see docs/adr/0002-localstorage-over-indexeddb.md
 */

import { defineStore } from 'pinia'
import { fsrs, createEmptyCard, Rating, State, type Card, type Grade } from 'ts-fsrs'
import type { DeckId, ReviewEntry, Settings } from '~/types'

const CURRENT_VERSION = 2

const defaultSettings: Settings = {
  newCardsPerDay: 5,
  maxReviewsPerDay: 100, // 0 = unlimited
  theme: 'system',
  requestRetention: 0.9,
  answerInputMode: 'romaji',
  activeDeck: 'kanji',
}

/** Returns the namespaced storage key for a card. */
export function getCardKey(deckId: DeckId, char: string): string {
  return `${deckId}:${char}`
}

export const useProgressStore = defineStore('progress', {
  state: () => ({
    /**
     * "deckId:char" → FSRS Card.
     * Absent key = never studied ("new").
     * Example keys: "kanji:日", "hiragana:あ"
     */
    cards: {} as Record<string, Card>,
    /** Append-only review log. Source of truth for stats. */
    log: [] as ReviewEntry[],
    settings: { ...defaultSettings },
    /** Schema version for migrations. */
    version: CURRENT_VERSION,
  }),

  getters: {
    /**
     * Build a fresh FSRS instance from current settings.
     * Not cached — settings.requestRetention may change.
     */
    scheduler: (state) =>
      fsrs({
        request_retention: state.settings.requestRetention,
      }),

    // ─── Per-deck getters ──────────────────────────────────────────

    /** Check if a character in a specific deck has never been studied. */
    isNew:
      (state) =>
      (deckId: DeckId, char: string): boolean =>
        !(getCardKey(deckId, char) in state.cards),

    /** Cards due today for a specific deck. Returns raw char strings (no prefix). */
    dueTodayByDeck: (state) => (deckId: DeckId) => {
      const now = new Date()
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      const prefix = `${deckId}:`
      const due: string[] = []

      for (const [key, card] of Object.entries(state.cards)) {
        if (key.startsWith(prefix)) {
          const dueDate = new Date(card.due)
          if (dueDate <= endOfToday) {
            due.push(key.slice(prefix.length))
          }
        }
      }
      return due
    },

    /** How many cards are in New state in a specific deck. */
    newCountByDeck: (state) => (deckId: DeckId) => {
      const prefix = `${deckId}:`
      return Object.entries(state.cards).filter(
        ([k, c]) => k.startsWith(prefix) && c.state === State.New,
      ).length
    },

    /** Cards in Learning or Relearning state for a specific deck. */
    learningCountByDeck: (state) => (deckId: DeckId) => {
      const prefix = `${deckId}:`
      return Object.entries(state.cards).filter(
        ([k, c]) =>
          k.startsWith(prefix) && (c.state === State.Learning || c.state === State.Relearning),
      ).length
    },

    /** Cards in Review state (graduated) for a specific deck. */
    reviewCountByDeck: (state) => (deckId: DeckId) => {
      const prefix = `${deckId}:`
      return Object.entries(state.cards).filter(
        ([k, c]) => k.startsWith(prefix) && c.state === State.Review,
      ).length
    },

    /** Total characters studied at least once in a specific deck. */
    totalStudiedByDeck: (state) => (deckId: DeckId) => {
      const prefix = `${deckId}:`
      return Object.keys(state.cards).filter((k) => k.startsWith(prefix)).length
    },

    // ─── Cross-deck aggregate getters (for stats page / heatmap) ──

    /**
     * How many new cards were introduced today across all decks.
     * Counts log entries where state was New and the review date is today.
     */
    newCardsIntroducedToday(state): number {
      const today = new Date()
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime()

      return state.log.filter((entry) => {
        const reviewTime = new Date(entry.review).getTime()
        return entry.state === State.New && reviewTime >= startOfToday
      }).length
    },

    /**
     * How many new cards were introduced today in a specific deck.
     */
    newCardsIntroducedTodayByDeck: (state) => (deckId: DeckId) => {
      const today = new Date()
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime()

      return state.log.filter((entry) => {
        const reviewTime = new Date(entry.review).getTime()
        return entry.deckId === deckId && entry.state === State.New && reviewTime >= startOfToday
      }).length
    },

    /** Number of reviews completed today (all decks). */
    reviewsDoneToday(state): number {
      const today = new Date()
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime()

      return state.log.filter((entry) => {
        const reviewTime = new Date(entry.review).getTime()
        return reviewTime >= startOfToday
      }).length
    },

    /**
     * Current streak: consecutive days with at least one review,
     * counting backwards from today (across all decks).
     */
    streak(state): number {
      if (state.log.length === 0) return 0

      const reviewDates = new Set(
        state.log.map((entry) => {
          const d = new Date(entry.review)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        }),
      )

      let count = 0
      const d = new Date()

      const todayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!reviewDates.has(todayKey)) {
        d.setDate(d.getDate() - 1)
        const yesterdayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        if (!reviewDates.has(yesterdayKey)) return 0
      }

      while (true) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        if (reviewDates.has(key)) {
          count++
          d.setDate(d.getDate() - 1)
        } else {
          break
        }
      }

      return count
    },

    /**
     * Retention rate: ratio of non-Again grades among mature (Review state) reviews.
     */
    retentionRate(state): number | null {
      const matureReviews = state.log.filter((entry) => entry.state === State.Review)
      if (matureReviews.length === 0) return null

      const passed = matureReviews.filter((entry) => entry.rating !== Rating.Again).length
      return passed / matureReviews.length
    },

    /**
     * Reviews grouped by local calendar date for heatmap display (all decks).
     */
    reviewHeatmap(state): Record<string, number> {
      const heatmap: Record<string, number> = {}

      for (const entry of state.log) {
        const d = new Date(entry.review)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        heatmap[key] = (heatmap[key] || 0) + 1
      }

      return heatmap
    },

    /**
     * Due forecast: count of cards due on each of the next 30 days (all decks).
     */
    dueForecast(state): { date: string; count: number }[] {
      const forecast: Record<string, number> = {}
      const now = new Date()

      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        forecast[key] = 0
      }

      for (const card of Object.values(state.cards)) {
        const dueDate = new Date(card.due)
        const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`
        if (key in forecast) {
          forecast[key] = (forecast[key] ?? 0) + 1
        }
      }

      return Object.entries(forecast).map(([date, count]) => ({ date, count }))
    },

    /** Total number of characters studied at least once (all decks). */
    totalStudied(state): number {
      return Object.keys(state.cards).length
    },

    // ─── Legacy aliases (kanji-only; kept for backward compat) ────

    /** @deprecated Use dueTodayByDeck('kanji') instead. */
    dueToday(state): string[] {
      const now = new Date()
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      const prefix = 'kanji:'
      const due: string[] = []

      for (const [key, card] of Object.entries(state.cards)) {
        if (key.startsWith(prefix)) {
          if (new Date(card.due) <= endOfToday) {
            due.push(key.slice(prefix.length))
          }
        }
      }
      // Also handle un-migrated legacy keys (no prefix)
      for (const [key, card] of Object.entries(state.cards)) {
        if (!key.includes(':')) {
          if (new Date(card.due) <= endOfToday) {
            due.push(key)
          }
        }
      }
      return due
    },

    /** @deprecated Use newCountByDeck('kanji') instead. */
    newCount(state): number {
      return Object.entries(state.cards).filter(
        ([k, c]) => (k.startsWith('kanji:') || !k.includes(':')) && c.state === State.New,
      ).length
    },

    /** @deprecated Use learningCountByDeck('kanji') instead. */
    learningCount(state): number {
      return Object.entries(state.cards).filter(
        ([k, c]) =>
          (k.startsWith('kanji:') || !k.includes(':')) &&
          (c.state === State.Learning || c.state === State.Relearning),
      ).length
    },

    /** @deprecated Use reviewCountByDeck('kanji') instead. */
    reviewCount(state): number {
      return Object.entries(state.cards).filter(
        ([k, c]) => (k.startsWith('kanji:') || !k.includes(':')) && c.state === State.Review,
      ).length
    },
  },

  actions: {
    /**
     * Grade a card for a specific deck. Creates the card if it's new.
     *
     * @param deckId - The deck this card belongs to
     * @param char   - The character (without prefix)
     * @param grade  - FSRS grade (Again=1, Hard=2, Good=3, Easy=4)
     */
    gradeCard(deckId: DeckId, char: string, grade: Grade) {
      const key = getCardKey(deckId, char)
      const now = new Date()
      const currentCard = key in this.cards ? this.cards[key]! : createEmptyCard(now)

      const result = this.scheduler.next(currentCard, now, grade)

      this.cards[key] = result.card
      this.log.push({
        ...result.log,
        char,
        deckId,
      })
    },

    /**
     * Get the available new cards that can be introduced today for a deck,
     * respecting the per-deck daily cap.
     *
     * @param deckId   - The target deck
     * @param allChars - All characters in that deck
     */
    getAvailableNewCards(deckId: DeckId, allChars: string[]): string[] {
      const remaining = this.settings.newCardsPerDay - this.newCardsIntroducedTodayByDeck(deckId)
      if (remaining <= 0) return []

      const prefix = `${deckId}:`
      const newCards = allChars.filter((char) => !(prefix + char in this.cards))
      return newCards.slice(0, remaining)
    },

    /**
     * Build today's study queue for a deck: due reviews + new card intake.
     *
     * @param deckId   - The target deck
     * @param allChars - All characters in that deck
     */
    getStudyQueue(deckId: DeckId, allChars: string[]): string[] {
      const queue: string[] = [...this.dueTodayByDeck(deckId)]
      const newCards = this.getAvailableNewCards(deckId, allChars)
      queue.push(...newCards)
      return queue
    },

    /** Update user settings. */
    updateSettings(patch: Partial<Settings>) {
      this.settings = { ...this.settings, ...patch }
    },

    /**
     * Migrate schema from v1 (bare char keys) to v2 (deckId:char keys).
     * Also backfills deckId on log entries.
     * Called automatically by the store plugin after rehydration.
     */
    migrateSchema() {
      if (this.version < 2) {
        // Migrate card keys
        const migratedCards: Record<string, Card> = {}
        for (const [key, card] of Object.entries(this.cards)) {
          const newKey = key.includes(':') ? key : `kanji:${key}`
          migratedCards[newKey] = card
        }
        this.cards = migratedCards

        // Backfill deckId on log entries (cast to any for migration)
        this.log = this.log.map((entry) => ({
          ...entry,
          deckId: (entry as { deckId?: string }).deckId ?? 'kanji',
        })) as ReviewEntry[]

        this.version = 2
      }
    },

    /** Export progress as a JSON string. */
    exportProgress(): string {
      return JSON.stringify({
        cards: this.cards,
        log: this.log,
        settings: this.settings,
        version: this.version,
      })
    },

    /** Import progress from a JSON string. */
    importProgress(json: string) {
      const data = JSON.parse(json)
      if (data.version && data.cards && data.log) {
        this.cards = data.cards
        this.log = data.log
        if (data.settings) {
          this.settings = { ...defaultSettings, ...data.settings }
        }
        this.version = data.version
        // Run migration in case imported data is v1
        this.migrateSchema()
      }
    },

    /** Reset all progress. Settings are preserved. */
    resetProgress() {
      this.cards = {}
      this.log = []
    },
  },

  persist: {
    key: 'kanji-srs-progress',
    pick: ['cards', 'log', 'settings', 'version'],
    afterHydrate: (ctx) => {
      // Auto-run migration after localStorage is loaded
      ctx.store.migrateSchema()
    },
  },
})
