/**
 * Composable for accessing kanji dictionary data.
 *
 * Provides typed access to the static kanji.json content
 * and convenience lookups.
 */

import kanjiData from '~/data/kanji.json'
import { N5_KANJI_LIST } from '~/data/n5-list'
import type { KanjiDictionary, KanjiEntry } from '~/types'

const dictionary = kanjiData as KanjiDictionary

/**
 * Access the N5 kanji dictionary.
 *
 * @example
 * ```vue
 * const { lookup, allKanji, kanjiList } = useKanji()
 * const entry = lookup('日')
 * ```
 */
export function useKanji() {
  /** O(1) lookup by character. Returns undefined for unknown kanji. */
  function lookup(char: string): KanjiEntry | undefined {
    return dictionary[char]
  }

  /** The ordered list of all N5 kanji characters. */
  const kanjiList = N5_KANJI_LIST

  /** All KanjiEntry objects, ordered by the N5 list. */
  const allKanji = computed<KanjiEntry[]>(() =>
    N5_KANJI_LIST.map((char) => dictionary[char]).filter((item): item is KanjiEntry =>
      Boolean(item),
    ),
  )

  /** Total count of kanji in the deck. */
  const totalCount = N5_KANJI_LIST.length

  return {
    lookup,
    kanjiList,
    allKanji,
    totalCount,
    dictionary,
  }
}
