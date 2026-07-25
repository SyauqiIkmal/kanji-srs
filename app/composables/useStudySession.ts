/**
 * Composable for managing a study session.
 *
 * Orchestrates the review flow: builds a queue, tracks position,
 * handles grading, and manages session state.
 */

import { type Grade, Rating } from 'ts-fsrs'
import { useProgressStore } from '~/stores/progress'
import type { AnswerFeedback } from '~/types'

export type SessionPhase = 'idle' | 'question' | 'answer' | 'complete'

export function useStudySession() {
  const progress = useProgressStore()
  const { kanjiList, lookup } = useKanji()

  // ─── Session state ────────────────────────────────────

  /** The queue of kanji characters to study this session. */
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

  /** The current kanji character being studied. */
  const currentChar = computed(() => queue.value[currentIndex.value] ?? null)

  /** The full kanji entry for the current character. */
  const currentEntry = computed(() => (currentChar.value ? lookup(currentChar.value) : null))

  /** Whether there are more cards in the queue. */
  const hasMore = computed(() => currentIndex.value < queue.value.length)

  /** Total cards in this session's queue. */
  const totalCards = computed(() => queue.value.length)

  /** Cards remaining (including current). */
  const remaining = computed(() => Math.max(0, queue.value.length - currentIndex.value))

  // ─── Actions ──────────────────────────────────────────

  /** Start a new study session. Builds the queue from due + new cards. */
  function startSession() {
    const studyQueue = progress.getStudyQueue([...kanjiList])

    if (studyQueue.length === 0) {
      phase.value = 'complete'
      return
    }

    // Shuffle the queue for variety
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
    lastFeedback.value = checkKanjiReading(input, currentEntry.value)
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

    // Grade the card via the progress store
    progress.gradeCard(currentChar.value, rating)

    // Track session stats
    sessionCount.value++
    sessionGrades.value[rating] = (sessionGrades.value[rating] ?? 0) + 1

    // If graded Again, re-add to the end of the queue for re-review
    if (rating === Rating.Again) {
      queue.value.push(currentChar.value)
    }

    // Reset card-specific state
    userAnswer.value = ''
    lastFeedback.value = null

    // Advance to next card
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
