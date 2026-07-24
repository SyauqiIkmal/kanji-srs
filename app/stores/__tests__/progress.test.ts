/**
 * Unit tests for the progress store.
 *
 * Tests the FSRS integration, study queue logic, streak calculation,
 * and import/export functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Rating } from 'ts-fsrs'
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
      expect(store.version).toBe(1)
    })

    it('has sensible default settings', () => {
      const store = useProgressStore()
      expect(store.settings.newCardsPerDay).toBe(5)
      expect(store.settings.maxReviewsPerDay).toBe(100)
      expect(store.settings.theme).toBe('system')
      expect(store.settings.requestRetention).toBe(0.9)
    })
  })

  describe('isNew', () => {
    it('returns true for a character not in cards', () => {
      const store = useProgressStore()
      expect(store.isNew('日')).toBe(true)
    })

    it('returns false after grading a character', () => {
      const store = useProgressStore()
      store.gradeCard('日', Rating.Good)
      expect(store.isNew('日')).toBe(false)
    })
  })

  describe('gradeCard', () => {
    it('creates a new card and appends a log entry', () => {
      const store = useProgressStore()
      store.gradeCard('日', Rating.Good)

      expect(store.cards['日']).toBeDefined()
      expect(store.cards['日']!.reps).toBe(1)
      expect(store.log).toHaveLength(1)
      expect(store.log[0]!.char).toBe('日')
      expect(store.log[0]!.rating).toBe(Rating.Good)
    })

    it('updates an existing card on subsequent grades', () => {
      const store = useProgressStore()
      store.gradeCard('日', Rating.Good)
      store.gradeCard('日', Rating.Good)

      expect(store.cards['日']!.reps).toBe(2)
      expect(store.log).toHaveLength(2)
    })

    it('handles Again grade', () => {
      const store = useProgressStore()
      store.gradeCard('日', Rating.Again)

      expect(store.cards['日']).toBeDefined()
      expect(store.log[0]!.rating).toBe(Rating.Again)
    })

    it('handles all four grades', () => {
      const store = useProgressStore()

      store.gradeCard('一', Rating.Again)
      store.gradeCard('二', Rating.Hard)
      store.gradeCard('三', Rating.Good)
      store.gradeCard('四', Rating.Easy)

      expect(Object.keys(store.cards)).toHaveLength(4)
      expect(store.log).toHaveLength(4)
    })
  })

  describe('counts', () => {
    it('tracks totalStudied', () => {
      const store = useProgressStore()
      expect(store.totalStudied).toBe(0)

      store.gradeCard('日', Rating.Good)
      store.gradeCard('月', Rating.Good)
      expect(store.totalStudied).toBe(2)
    })
  })

  describe('getAvailableNewCards', () => {
    it('returns up to newCardsPerDay new cards', () => {
      const store = useProgressStore()
      const allKanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

      const available = store.getAvailableNewCards(allKanji)
      expect(available).toHaveLength(5) // default cap
    })

    it('excludes already-studied cards and respects daily cap', () => {
      const store = useProgressStore()
      store.gradeCard('一', Rating.Good)
      store.gradeCard('二', Rating.Good)

      const allKanji = ['一', '二', '三', '四', '五', '六', '七']
      const available = store.getAvailableNewCards(allKanji)

      expect(available).not.toContain('一')
      expect(available).not.toContain('二')
      // 5 cap - 2 already introduced today = 3 remaining
      expect(available).toHaveLength(3)
      expect(available).toEqual(['三', '四', '五'])
    })
  })

  describe('settings', () => {
    it('updates settings partially', () => {
      const store = useProgressStore()
      store.updateSettings({ newCardsPerDay: 10 })

      expect(store.settings.newCardsPerDay).toBe(10)
      expect(store.settings.theme).toBe('system') // unchanged
    })
  })

  describe('export/import', () => {
    it('round-trips progress data', () => {
      const store = useProgressStore()
      store.gradeCard('日', Rating.Good)
      store.gradeCard('月', Rating.Easy)
      store.updateSettings({ newCardsPerDay: 10 })

      const exported = store.exportProgress()

      // Reset and reimport
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
      store.gradeCard('日', Rating.Good)
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
      store.gradeCard('日', Rating.Good)
      store.gradeCard('月', Rating.Easy)

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
