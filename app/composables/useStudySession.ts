/**
 * Composable for managing a study session.
 *
 * Orchestrates the review flow: builds a queue, tracks position,
 * handles grading, and manages session state.
 *
 * Supports both the Kanji deck and the Hiragana deck via the `deckId` parameter.
 */

import { type Grade, Rating } from 'ts-fsrs'
import { useProgressStore } from '~/stores/progress'
import type { AnswerFeedback, DeckId, DeckEntry } from '~/types'
import { isHiraganaEntry, isKanjiEntry } from '~/types'
import { checkKanjiReading, checkHiraganaReading } from '~/utils/romaji'

export type SessionPhase = 'idle' | 'question' | 'answer' | 'complete'

export function useStudySession(deckId: DeckId = 'kanji') {
  const progress = useProgressStore()
  const { kanjiList, lookup: kanjiLookup } = useKanji()
  const { charList: hiraganaCharList, lookup: hiraganaLookup } = useHiragana()

  // ─── Session state ────────────────────────────────────

  /** The queue of characters to study this session. */
  const queue = ref<string[]>([])

  /** Current position in the queue. */
  const currentIndex = ref(0)

  /** Current phase of the review card. */
  const phase = ref<SessionPhase>('idle')

  /** Number of cards graded this session. */
  const sessionCount = ref(0)

  /** Breakdown of grades given this session. */
  const sessionGrades = ref<Record<number, number>>({
    [Rating.Again]: 0,
    [Rating.Hard]: 0,
    [Rating.Good]: 0,
    [Rating.Easy]: 0,
  })

  /** User typed answer in question phase. */
  const userAnswer = ref('')

  /** Verification feedback for the submitted answer. */
  const lastFeedback = ref<AnswerFeedback | null>(null)

  // ─── Derived state ────────────────────────────────────

  /** The current character being studied. */
  const currentChar = computed(() => queue.value[currentIndex.value] ?? null)

  /**
   * The full entry for the current character (KanjiEntry or HiraganaEntry).
   * Consumers can use isKanjiEntry / isHiraganaEntry type guards from types/index.ts.
   */
  const currentEntry = computed<DeckEntry | null>(() => {
    if (!currentChar.value) return null
    if (deckId === 'hiragana') {
      return hiraganaLookup(currentChar.value) ?? null
    }
    return kanjiLookup(currentChar.value) ?? null
  })

  /** Whether there are more cards in the queue. */
  const hasMore = computed(() => currentIndex.value < queue.value.length)

  /** Total cards in this session's queue. */
  const totalCards = computed(() => queue.value.length)

  /** Cards remaining (including current). */
  const remaining = computed(() => Math.max(0, queue.value.length - currentIndex.value))

  // ─── Actions ──────────────────────────────────────────

  /** Start a new study session. Builds the queue from due + new cards. */
  function startSession() {
    const allChars = deckId === 'hiragana' ? [...hiraganaCharList] : [...kanjiList]
    const studyQueue = progress.getStudyQueue(deckId, allChars)

    if (studyQueue.length === 0) {
      phase.value = 'complete'
      return
    }

    queue.value = shuffleArray(studyQueue)
    currentIndex.value = 0
    sessionCount.value = 0
    sessionGrades.value = {
      [Rating.Again]: 0,
      [Rating.Hard]: 0,
      [Rating.Good]: 0,
      [Rating.Easy]: 0,
    }
    userAnswer.value = ''
    lastFeedback.value = null
    phase.value = 'question'
  }

  /** Submit a typed answer for verification and reveal the card. */
  function submitAnswer(input: string) {
    if (phase.value !== 'question' || !currentEntry.value) return
    userAnswer.value = input

    if (deckId === 'hiragana' && isHiraganaEntry(currentEntry.value)) {
      lastFeedback.value = checkHiraganaReading(input, currentEntry.value)
    } else if (deckId === 'kanji' && isKanjiEntry(currentEntry.value)) {
      lastFeedback.value = checkKanjiReading(input, currentEntry.value)
    }

    phase.value = 'answer'
  }

  /** Reveal the answer for the current card without feedback. */
  function revealAnswer() {
    if (phase.value === 'question') {
      userAnswer.value = ''
      lastFeedback.value = null
      phase.value = 'answer'
    }
  }

  /** Grade the current card and advance to the next. */
  function grade(rating: Grade) {
    if (phase.value !== 'answer' || !currentChar.value) return

    progress.gradeCard(deckId, currentChar.value, rating)

    sessionCount.value++
    sessionGrades.value[rating] = (sessionGrades.value[rating] ?? 0) + 1

    if (rating === Rating.Again) {
      queue.value.push(currentChar.value)
    }

    userAnswer.value = ''
    lastFeedback.value = null
    currentIndex.value++

    if (currentIndex.value >= queue.value.length) {
      phase.value = 'complete'
    } else {
      phase.value = 'question'
    }
  }

  /** Reset the session state. */
  function endSession() {
    queue.value = []
    currentIndex.value = 0
    userAnswer.value = ''
    lastFeedback.value = null
    phase.value = 'idle'
  }

  return {
    // State
    phase: readonly(phase),
    queue: readonly(queue),
    currentIndex: readonly(currentIndex),
    sessionCount: readonly(sessionCount),
    sessionGrades: readonly(sessionGrades),
    userAnswer: readonly(userAnswer),
    lastFeedback: readonly(lastFeedback),

    // Derived
    currentChar,
    currentEntry,
    hasMore,
    totalCards,
    remaining,

    // Actions
    startSession,
    submitAnswer,
    revealAnswer,
    grade,
    endSession,
  }
}

// ─── Helpers ──────────────────────────────────────────────

/** Fisher-Yates shuffle (returns a new array). */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = tmp
  }
  return shuffled
}
