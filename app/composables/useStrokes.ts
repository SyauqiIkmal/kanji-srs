/**
 * Composable for accessing stroke order data.
 *
 * Lazy loads `strokes.json` to keep the initial bundle small
 * (stroke path data is ~180 KB and only needed during card detail / reveal).
 *
 * @see docs/DATA-MODEL.md §1
 */

export type StrokeData = {
  /** Ordered SVG path `d` attributes, one per stroke. */
  paths: string[]
  /** viewBox is uniform across KanjiVG: "0 0 109 109". */
  viewBox: string
}

export type StrokeDictionary = Record<string, StrokeData>

let cachedStrokes: StrokeDictionary | null = null

export function useStrokes() {
  const isLoaded = ref(cachedStrokes !== null)
  const strokeData = ref<StrokeDictionary>(cachedStrokes || {})

  async function loadStrokes() {
    if (cachedStrokes) {
      strokeData.value = cachedStrokes
      isLoaded.value = true
      return
    }

    try {
      const data = await import('~/data/strokes.json')
      cachedStrokes = (data.default || data) as StrokeDictionary
      strokeData.value = cachedStrokes
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load strokes.json:', e)
    }
  }

  function getStroke(char: string): StrokeData | null {
    return strokeData.value[char] || null
  }

  onMounted(() => {
    if (!isLoaded.value) {
      loadStrokes()
    }
  })

  return {
    isLoaded: readonly(isLoaded),
    strokeData: readonly(strokeData),
    loadStrokes,
    getStroke,
  }
}
