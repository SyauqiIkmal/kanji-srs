/**
 * Progress store — the user's SRS state.
 *
 * Persisted to localStorage via pinia-plugin-persistedstate.
 * Uses ts-fsrs for scheduling; stores its Card type verbatim.
 *
 * @see docs/DATA-MODEL.md
 * @see docs/adr/0001-use-fsrs-over-sm2.md
 * @see docs/adr/0002-localstorage-over-indexeddb.md
 */

import { defineStore } from 'pinia'
import { fsrs, createEmptyCard, Rating, State, type Card, type Grade } from 'ts-fsrs'
import type { ReviewEntry, Settings } from '~/types'

const CURRENT_VERSION = 1

const defaultSettings: Settings = {
  newCardsPerDay: 5,
  maxReviewsPerDay: 100, // 0 = unlimited
  theme: 'system',
  requestRetention: 0.9,
  answerInputMode: 'romaji',
}

export const useProgressStore = defineStore('progress', {
  state: () => ({
    /** char → FSRS Card. Absent key = never studied ("new"). */
    cards: {} as Record<string, Card>,
    /** Append-only review log. Source of truth for stats. */
    log: [] as ReviewEntry[],
    settings: { ...defaultSettings },
    /** Schema version for future migrations. */
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

    /** Check if a character has never been studied. */
    isNew:
      (state) =>
      (char: string): boolean =>
        !(char in state.cards),

    /** Cards where state is New (not yet in the cards map counts too). */
    newCount(state): number {
      return Object.values(state.cards).filter((c) => c.state === State.New).length
    },

    /** Cards in Learning or Relearning state. */
    learningCount(state): number {
      return Object.values(state.cards).filter(
        (c) => c.state === State.Learning || c.state === State.Relearning,
      ).length
    },

    /** Cards in Review state (graduated). */
    reviewCount(state): number {
      return Object.values(state.cards).filter((c) => c.state === State.Review).length
    },

    /**
     * Cards due today: reviews whose due date ≤ end of today,
     * plus new-card intake up to the daily cap.
     */
    dueToday(state): string[] {
      const now = new Date()
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      const due: string[] = []

      for (const [char, card] of Object.entries(state.cards)) {
        const dueDate = new Date(card.due)
        if (dueDate <= endOfToday) {
          due.push(char)
        }
      }

      return due
    },

    /**
     * How many new cards were introduced today.
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
     * Number of reviews completed today (all grades).
     */
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
     * counting backwards from today.
     */
    streak(state): number {
      if (state.log.length === 0) return 0

      // Group reviews by local date string
      const reviewDates = new Set(
        state.log.map((entry) => {
          const d = new Date(entry.review)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        }),
      )

      let count = 0
      const d = new Date()

      // Check today first
      const todayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!reviewDates.has(todayKey)) {
        // If no review today, check if yesterday had one (streak is still alive)
        d.setDate(d.getDate() - 1)
        const yesterdayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        if (!reviewDates.has(yesterdayKey)) return 0
      }

      // Count consecutive days backwards
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
     * Reviews grouped by local calendar date for heatmap display.
     */
    reviewHeatmap(state): Record<string, number> {
      const heatmap: Record<string, number> = {}

      for (const entry of state.log) {
        const d = new Date(entry.review)
        // ISO date string YYYY-MM-DD
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        heatmap[key] = (heatmap[key] || 0) + 1
      }

      return heatmap
    },

    /**
     * Due forecast: count of cards due on each of the next 30 days.
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

    /** Total number of kanji the user has studied at least once. */
    totalStudied(state): number {
      return Object.keys(state.cards).length
    },
  },

  actions: {
    /**
     * Grade a kanji card. Creates the card if it's new.
     *
     * @param char - The kanji character
     * @param grade - FSRS grade (Again=1, Hard=2, Good=3, Easy=4)
     */
    gradeCard(char: string, grade: Grade) {
      const now = new Date()
      const currentCard = char in this.cards ? this.cards[char]! : createEmptyCard(now)

      const result = this.scheduler.next(currentCard, now, grade)

      // Store updated card state
      this.cards[char] = result.card

      // Append to review log
      this.log.push({
        ...result.log,
        char,
      })
    },

    /**
     * Get the available new cards that can be introduced today,
     * respecting the daily cap.
     *
     * @param allKanji - All kanji characters in the deck
     */
    getAvailableNewCards(allKanji: string[]): string[] {
      const remaining = this.settings.newCardsPerDay - this.newCardsIntroducedToday
      if (remaining <= 0) return []

      const newCards = allKanji.filter((char) => !(char in this.cards))
      return newCards.slice(0, remaining)
    },

    /**
     * Build today's study queue: due reviews + new card intake.
     *
     * @param allKanji - All kanji characters in the deck
     */
    getStudyQueue(allKanji: string[]): string[] {
      const queue: string[] = [...this.dueToday]
      const newCards = this.getAvailableNewCards(allKanji)
      queue.push(...newCards)
      return queue
    },

    /** Update user settings. */
    updateSettings(patch: Partial<Settings>) {
      this.settings = { ...this.settings, ...patch }
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
  },
})
