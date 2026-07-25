import { describe, it, expect } from 'vitest'
import { normalizeRomaji, kanaToRomaji, checkKanjiReading } from '../romaji'
import type { KanjiEntry } from '~/types'

describe('romaji utility', () => {
  describe('normalizeRomaji', () => {
    it('lowercases and trims whitespace', () => {
      expect(normalizeRomaji('  YASUI  ')).toBe('yasui')
    })

    it('strips okurigana dots and hyphens', () => {
      expect(normalizeRomaji('yasu.i')).toBe('yasui')
      expect(normalizeRomaji('-bi')).toBe('bi')
      expect(normalizeRomaji('hito-')).toBe('hito')
    })

    it('handles empty input', () => {
      expect(normalizeRomaji('')).toBe('')
    })
  })

  describe('kanaToRomaji', () => {
    it('converts Katakana to normalized Romaji', () => {
      expect(kanaToRomaji('アン')).toBe('an')
      expect(kanaToRomaji('イチ')).toBe('ichi')
    })

    it('converts Hiragana with dots to normalized Romaji', () => {
      expect(kanaToRomaji('やす.い')).toBe('yasui')
      expect(kanaToRomaji('ひと.つ')).toBe('hitotsu')
    })
  })

  describe('checkKanjiReading', () => {
    const sampleKanjiAn: KanjiEntry = {
      char: '安',
      codepoint: '05b89',
      meanings: ['cheap', 'relax'],
      onyomi: ['アン'],
      kunyomi: ['やす.い', 'やす.まる', 'やす', 'やす.らか'],
      strokeCount: 6,
      jlpt: 5,
      grade: 3,
      frequency: 144,
      examples: [],
    }

    const sampleKanjiNichi: KanjiEntry = {
      char: '日',
      codepoint: '065e5',
      meanings: ['day', 'sun'],
      onyomi: ['ニチ', 'ジツ'],
      kunyomi: ['ひ', '-び', '-か'],
      strokeCount: 4,
      jlpt: 5,
      grade: 1,
      frequency: 1,
      examples: [],
    }

    const sampleKanjiIchi: KanjiEntry = {
      char: '一',
      codepoint: '04e00',
      meanings: ['one'],
      onyomi: ['イチ', 'イツ'],
      kunyomi: ['ひと-', 'ひと.つ'],
      strokeCount: 1,
      jlpt: 5,
      grade: 1,
      frequency: 2,
      examples: [],
    }

    it("matches exact On'yomi in uppercase and lowercase", () => {
      const resLower = checkKanjiReading('an', sampleKanjiAn)
      expect(resLower.isCorrect).toBe(true)
      expect(resLower.matchedType).toBe('onyomi')
      expect(resLower.matchedReading).toBe('アン')

      const resUpper = checkKanjiReading('AN', sampleKanjiAn)
      expect(resUpper.isCorrect).toBe(true)
    })

    it("matches full Kun'yomi reading with okurigana", () => {
      const res = checkKanjiReading('yasui', sampleKanjiAn)
      expect(res.isCorrect).toBe(true)
      expect(res.matchedType).toBe('kunyomi')
      expect(res.matchedReading).toBe('やす.い')
    })

    it("matches Kun'yomi stem before okurigana dot", () => {
      const res = checkKanjiReading('yasu', sampleKanjiAn)
      expect(res.isCorrect).toBe(true)
      expect(res.matchedType).toBe('kunyomi')
    })

    it('matches suffixed reading with hyphen stripped', () => {
      const res = checkKanjiReading('bi', sampleKanjiNichi)
      expect(res.isCorrect).toBe(true)
      expect(res.matchedType).toBe('kunyomi')
      expect(res.matchedReading).toBe('-び')
    })

    it("matches one of multiple On'yomi readings", () => {
      const resJitsu = checkKanjiReading('jitsu', sampleKanjiNichi)
      expect(resJitsu.isCorrect).toBe(true)
      expect(resJitsu.matchedReading).toBe('ジツ')

      const resIchi = checkKanjiReading('ichi', sampleKanjiIchi)
      expect(resIchi.isCorrect).toBe(true)
      expect(resIchi.matchedReading).toBe('イチ')
    })

    it('supports wanakana Hepburn/Nihon-shiki romanization variants', () => {
      const resIti = checkKanjiReading('iti', sampleKanjiIchi)
      expect(resIti.isCorrect).toBe(true)
    })

    it('returns isCorrect: false for wrong answers', () => {
      const res = checkKanjiReading('xyz', sampleKanjiAn)
      expect(res.isCorrect).toBe(false)
      expect(res.matchedType).toBeUndefined()
    })

    it('returns isCorrect: false for empty input', () => {
      const res = checkKanjiReading('', sampleKanjiAn)
      expect(res.isCorrect).toBe(false)
    })
  })
})
