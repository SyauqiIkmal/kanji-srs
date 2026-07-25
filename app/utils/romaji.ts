import { toRomaji, toKana, toHiragana } from 'wanakana'
import type { AnswerFeedback, KanjiEntry } from '~/types'

/**
 * Normalizes Romaji string: lowercases, trims whitespace, and strips okurigana dots ('.') and hyphens ('-').
 */
export function normalizeRomaji(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/[.\-\s]/g, '')
}

/**
 * Converts a Kana string (Hiragana or Katakana) into normalized Romaji.
 */
export function kanaToRomaji(kana: string): string {
  if (!kana) return ''
  const romaji = toRomaji(kana)
  return normalizeRomaji(romaji)
}

/**
 * Checks whether user input matches any On'yomi or Kun'yomi reading of the given Kanji entry.
 *
 * Handles:
 * - On'yomi katakana matching (e.g., "アン" matches "an" or "AN")
 * - Full Kun'yomi matching (e.g., "やす.い" matches "yasui")
 * - Kun'yomi stem matching before okurigana (e.g., "やす.い" matches "yasu")
 * - Prefixed/suffixed reading matching (e.g., "-び" matches "bi")
 * - Hepburn/Nihon-shiki/Kunrei-shiki variants via wanakana (e.g., "イチ" matches "ichi" or "iti")
 */
export function checkKanjiReading(input: string, entry: KanjiEntry): AnswerFeedback {
  const userTyped = input.trim()
  const normalizedInput = normalizeRomaji(userTyped)

  if (!normalizedInput || !entry) {
    return {
      userTyped,
      isCorrect: false,
    }
  }

  // Convert normalized Romaji input to Hiragana for dual matching
  const inputKanaHiragana = toHiragana(toKana(normalizedInput))

  // 1. Check On'yomi readings
  for (const onyomiReading of entry.onyomi) {
    const onyomiRomaji = kanaToRomaji(onyomiReading)
    const onyomiHiragana = toHiragana(onyomiReading)

    if (normalizedInput === onyomiRomaji || inputKanaHiragana === onyomiHiragana) {
      return {
        userTyped,
        isCorrect: true,
        matchedType: 'onyomi',
        matchedReading: onyomiReading,
      }
    }
  }

  // 2. Check Kun'yomi readings
  for (const kunyomiReading of entry.kunyomi) {
    // Clean Kana reading (stripping dots and hyphens)
    const cleanReadingKana = kunyomiReading.replace(/[.\-\s]/g, '')
    const cleanReadingHiragana = toHiragana(cleanReadingKana)
    const fullRomaji = kanaToRomaji(kunyomiReading)

    if (normalizedInput === fullRomaji || inputKanaHiragana === cleanReadingHiragana) {
      return {
        userTyped,
        isCorrect: true,
        matchedType: 'kunyomi',
        matchedReading: kunyomiReading,
      }
    }

    // Stem reading match (before okurigana dot '.')
    if (kunyomiReading.includes('.')) {
      const stemKana = kunyomiReading.split('.')[0]!
      const stemRomaji = kanaToRomaji(stemKana)
      const stemHiragana = toHiragana(stemKana)

      if (
        (stemRomaji && normalizedInput === stemRomaji) ||
        (stemHiragana && inputKanaHiragana === stemHiragana)
      ) {
        return {
          userTyped,
          isCorrect: true,
          matchedType: 'kunyomi',
          matchedReading: kunyomiReading,
        }
      }
    }
  }

  return {
    userTyped,
    isCorrect: false,
  }
}
