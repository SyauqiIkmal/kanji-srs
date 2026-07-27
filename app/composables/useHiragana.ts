/**
 * Composable for accessing the hiragana dictionary data.
 *
 * Provides typed access to the static hiragana.json content
 * and convenience lookups / grid groupings.
 */

import hiraganaData from '~/data/hiragana.json'
import type { HiraganaEntry, HiraganaCategory, HiraganaGroup } from '~/types'

const hiraganaList = hiraganaData as HiraganaEntry[]

// Build a lookup map at module level for O(1) access
const hiraganaMap = new Map<string, HiraganaEntry>(hiraganaList.map((e) => [e.char, e]))

/**
 * Access the hiragana dictionary.
 *
 * @example
 * ```vue
 * const { lookup, charList, byCategory } = useHiragana()
 * const entry = lookup('あ')
 * const gojuon = byCategory('gojuon')
 * ```
 */
export function useHiragana() {
  /** O(1) lookup by character. Returns undefined for unknown characters. */
  function lookup(char: string): HiraganaEntry | undefined {
    return hiraganaMap.get(char)
  }

  /** The ordered list of all hiragana characters. */
  const charList = hiraganaList.map((e) => e.char)

  /** All HiraganaEntry objects. */
  const allHiragana = computed<HiraganaEntry[]>(() => hiraganaList)

  /** Total count of hiragana characters. */
  const totalCount = hiraganaList.length

  /** Filter entries by category. */
  function byCategory(category: HiraganaCategory): HiraganaEntry[] {
    return hiraganaList.filter((e) => e.category === category)
  }

  /** Filter entries by row group. */
  function byGroup(group: HiraganaGroup): HiraganaEntry[] {
    return hiraganaList.filter((e) => e.group === group)
  }

  /**
   * Returns entries laid out for the Gojūon 5×10 grid.
   * Result is a 10-row × 5-column sparse matrix (null = absent cell).
   * Row 0 = a-row … Row 9 = wa-row. Column 0–4 = a, i, u, e, o.
   */
  const gojuonGrid = computed<(HiraganaEntry | null)[][]>(() => {
    const grid: (HiraganaEntry | null)[][] = Array.from({ length: 10 }, () => Array(5).fill(null))

    const gojuon = hiraganaList.filter((e) => e.category === 'gojuon')
    for (const entry of gojuon) {
      if (entry.gridRow != null && entry.gridCol != null) {
        grid[entry.gridRow]![entry.gridCol] = entry
      }
    }
    return grid
  })

  /** Dakuon entries (voiced). */
  const dakuon = computed<HiraganaEntry[]>(() =>
    hiraganaList.filter((e) => e.category === 'dakuon'),
  )

  /** Handakuon entries (semi-voiced, pa-row). */
  const handakuon = computed<HiraganaEntry[]>(() =>
    hiraganaList.filter((e) => e.category === 'handakuon'),
  )

  /** Yōon entries (contracted sounds). */
  const yoon = computed<HiraganaEntry[]>(() => hiraganaList.filter((e) => e.category === 'yoon'))

  return {
    lookup,
    charList,
    allHiragana,
    totalCount,
    byCategory,
    byGroup,
    gojuonGrid,
    dakuon,
    handakuon,
    yoon,
    dictionary: hiraganaMap,
  }
}
