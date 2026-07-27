/**
 * Unit tests for the progress store.
 *
 * Tests the FSRS integration, study queue logic, streak calculation,
 * multi-deck schema migration, and import/export functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Rating, createEmptyCard } from 'ts-fsrs'
import { useProgressStore } from '~/stores/progress'

describe('useProgressStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with empty cards and log', () => {
      const store = useProgressStore()
      expect(store.cards).toEqual({})
      expect(store.log).toEqual([])
      expect(store.version).toBe(2)
    })

    it('has sensible default settings', () => {
      const store = useProgressStore()
      expect(store.settings.newCardsPerDay).toBe(5)
      expect(store.settings.maxReviewsPerDay).toBe(100)
      expect(store.settings.theme).toBe('system')
      expect(store.settings.requestRetention).toBe(0.9)
      expect(store.settings.activeDeck).toBe('kanji')
    })
  })

  describe('isNew (deck-scoped)', () => {
    it('returns true for a character not in cards', () => {
      const store = useProgressStore()
      expect(store.isNew('kanji', '日')).toBe(true)
      expect(store.isNew('hiragana', 'あ')).toBe(true)
    })

    it('returns false after grading a character', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      expect(store.isNew('kanji', '日')).toBe(false)
      // hiragana deck is still unaffected
      expect(store.isNew('hiragana', '日')).toBe(true)
    })
  })

  describe('gradeCard (deck-scoped)', () => {
    it('creates a namespaced card and appends a log entry', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)

      expect(store.cards['kanji:日']).toBeDefined()
      expect(store.cards['kanji:日']!.reps).toBe(1)
      expect(store.log).toHaveLength(1)
      expect(store.log[0]!.char).toBe('日')
      expect(store.log[0]!.deckId).toBe('kanji')
      expect(store.log[0]!.rating).toBe(Rating.Good)
    })

    it('hiragana cards are stored under hiragana: prefix', () => {
      const store = useProgressStore()
      store.gradeCard('hiragana', 'あ', Rating.Good)

      expect(store.cards['hiragana:あ']).toBeDefined()
      expect(store.log[0]!.deckId).toBe('hiragana')
    })

    it('kanji and hiragana cards do not interfere', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      store.gradeCard('hiragana', 'あ', Rating.Good)

      expect(store.cards['kanji:日']).toBeDefined()
      expect(store.cards['hiragana:あ']).toBeDefined()
      expect(Object.keys(store.cards)).toHaveLength(2)
    })

    it('updates an existing card on subsequent grades', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      store.gradeCard('kanji', '日', Rating.Good)

      expect(store.cards['kanji:日']!.reps).toBe(2)
      expect(store.log).toHaveLength(2)
    })

    it('handles all four grades', () => {
      const store = useProgressStore()

      store.gradeCard('kanji', '一', Rating.Again)
      store.gradeCard('kanji', '二', Rating.Hard)
      store.gradeCard('kanji', '三', Rating.Good)
      store.gradeCard('kanji', '四', Rating.Easy)

      expect(Object.keys(store.cards)).toHaveLength(4)
      expect(store.log).toHaveLength(4)
    })
  })

  describe('per-deck counts', () => {
    it('totalStudied counts across all decks', () => {
      const store = useProgressStore()
      expect(store.totalStudied).toBe(0)

      store.gradeCard('kanji', '日', Rating.Good)
      store.gradeCard('hiragana', 'あ', Rating.Good)
      expect(store.totalStudied).toBe(2)
    })

    it('totalStudiedByDeck isolates per deck', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      store.gradeCard('kanji', '月', Rating.Good)
      store.gradeCard('hiragana', 'あ', Rating.Good)

      expect(store.totalStudiedByDeck('kanji')).toBe(2)
      expect(store.totalStudiedByDeck('hiragana')).toBe(1)
    })
  })

  describe('getAvailableNewCards (deck-scoped)', () => {
    it('returns up to newCardsPerDay new cards', () => {
      const store = useProgressStore()
      const allKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

      const available = store.getAvailableNewCards('kanji', allKanji)
      expect(available).toHaveLength(5) // default cap
    })

    it('excludes already-studied cards and respects per-deck daily cap', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '一', Rating.Good)
      store.gradeCard('kanji', '二', Rating.Good)

      const allKanji = ['一', '二', '三', '四', '五', '六', '七']
      const available = store.getAvailableNewCards('kanji', allKanji)

      expect(available).not.toContain('一')
      expect(available).not.toContain('二')
      // 5 cap - 2 already introduced today = 3 remaining
      expect(available).toHaveLength(3)
      expect(available).toEqual(['三', '四', '五'])
    })

    it('hiragana and kanji new card caps are independent', () => {
      const store = useProgressStore()
      // Use up 4 of 5 kanji slots
      store.gradeCard('kanji', '一', Rating.Good)
      store.gradeCard('kanji', '二', Rating.Good)
      store.gradeCard('kanji', '三', Rating.Good)
      store.gradeCard('kanji', '四', Rating.Good)

      // Hiragana should still get full 5-card cap
      const hiraganaAvailable = store.getAvailableNewCards('hiragana', [
        'あ',
        'い',
        'う',
        'え',
        'お',
        'か',
        'き',
      ])
      expect(hiraganaAvailable).toHaveLength(5)
    })
  })

  describe('migrateSchema (v1 → v2)', () => {
    it('converts bare char keys to kanji:char keys', () => {
      const store = useProgressStore()
      // Simulate v1 data: bare char key (no deck prefix), valid FSRS card
      store.cards = { 日: createEmptyCard() } as unknown as Record<string, Card>
      store.version = 1

      store.migrateSchema()

      expect(store.cards['kanji:日']).toBeDefined()
      expect(store.cards['日']).toBeUndefined()
      expect(store.version).toBe(2)
    })

    it('preserves already-prefixed keys', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      const cardBefore = store.cards['kanji:日']

      // Force re-migration
      store.version = 1
      store.migrateSchema()

      expect(store.cards['kanji:日']).toEqual(cardBefore)
    })

    it('backfills deckId on log entries without it', () => {
      const store = useProgressStore()
      // Simulate v1 log entries without deckId
      store.log = [
        {
          char: '日',
          rating: Rating.Good,
          review: new Date().toISOString(),
        } as unknown as ReviewEntry,
      ]
      store.version = 1

      store.migrateSchema()

      expect(store.log[0]!.deckId).toBe('kanji')
    })
  })

  describe('settings', () => {
    it('updates settings partially', () => {
      const store = useProgressStore()
      store.updateSettings({ newCardsPerDay: 10 })

      expect(store.settings.newCardsPerDay).toBe(10)
      expect(store.settings.theme).toBe('system') // unchanged
    })

    it('can switch activeDeck', () => {
      const store = useProgressStore()
      store.updateSettings({ activeDeck: 'hiragana' })
      expect(store.settings.activeDeck).toBe('hiragana')
    })
  })

  describe('export/import', () => {
    it('round-trips progress data', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      store.gradeCard('hiragana', 'あ', Rating.Easy)
      store.updateSettings({ newCardsPerDay: 10 })

      const exported = store.exportProgress()

      store.resetProgress()
      expect(store.totalStudied).toBe(0)

      store.importProgress(exported)
      expect(store.totalStudied).toBe(2)
      expect(store.log).toHaveLength(2)
      expect(store.settings.newCardsPerDay).toBe(10)
    })
  })

  describe('resetProgress', () => {
    it('clears cards and log but preserves settings', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      store.updateSettings({ newCardsPerDay: 20 })

      store.resetProgress()

      expect(store.cards).toEqual({})
      expect(store.log).toEqual([])
      expect(store.settings.newCardsPerDay).toBe(20) // preserved
    })
  })

  describe('streak', () => {
    it('returns 0 with no reviews', () => {
      const store = useProgressStore()
      expect(store.streak).toBe(0)
    })
  })

  describe('retentionRate', () => {
    it('returns null with no mature reviews', () => {
      const store = useProgressStore()
      expect(store.retentionRate).toBeNull()
    })
  })

  describe('reviewHeatmap', () => {
    it('starts empty', () => {
      const store = useProgressStore()
      expect(store.reviewHeatmap).toEqual({})
    })

    it('groups reviews by date after grading', () => {
      const store = useProgressStore()
      store.gradeCard('kanji', '日', Rating.Good)
      store.gradeCard('hiragana', 'あ', Rating.Easy)

      const heatmap = store.reviewHeatmap
      const dates = Object.keys(heatmap)
      expect(dates).toHaveLength(1) // both graded today
      expect(Object.values(heatmap)[0]).toBe(2)
    })
  })

  describe('dueForecast', () => {
    it('returns 30 entries', () => {
      const store = useProgressStore()
      expect(store.dueForecast).toHaveLength(30)
    })
  })
})
