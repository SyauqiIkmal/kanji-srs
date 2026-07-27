import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { type Grade, Rating } from 'ts-fsrs'
import { useStudySession } from '../useStudySession'

describe('useStudySession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts in idle phase and builds queue on startSession', () => {
    const session = useStudySession()
    expect(session.phase.value).toBe('idle')

    session.startSession()
    expect(session.phase.value).toBe('question')
    expect(session.totalCards.value).toBeGreaterThan(0)
  })

  it('verifies typed answer with submitAnswer and transitions to answer phase', () => {
    const session = useStudySession()
    session.startSession()

    expect(session.phase.value).toBe('question')
    expect(session.lastFeedback.value).toBeNull()

    session.submitAnswer('an')
    expect(session.phase.value).toBe('answer')
    expect(session.lastFeedback.value).not.toBeNull()
    expect(session.userAnswer.value).toBe('an')
  })

  it('resets answer and feedback state on card advancement in grade()', () => {
    const session = useStudySession()
    session.startSession()

    session.submitAnswer('test')
    expect(session.lastFeedback.value).not.toBeNull()

    session.grade(Rating.Good as Grade)
    expect(session.userAnswer.value).toBe('')
    expect(session.lastFeedback.value).toBeNull()
  })

  it('reveals answer without feedback when revealAnswer is called', () => {
    const session = useStudySession()
    session.startSession()

    session.revealAnswer()
    expect(session.phase.value).toBe('answer')
    expect(session.lastFeedback.value).toBeNull()
  })

  describe('hiragana deck session', () => {
    it('supports hiragana deck study session and romaji validation', () => {
      const session = useStudySession('hiragana')
      session.startSession()

      expect(session.phase.value).toBe('question')
      expect(session.totalCards.value).toBeGreaterThan(0)
      expect(session.currentEntry.value).toHaveProperty('romaji')

      const entry = session.currentEntry.value
      if (entry && 'romaji' in entry) {
        // Submit correct primary romaji
        session.submitAnswer(entry.romaji)
        expect(session.phase.value).toBe('answer')
        expect(session.lastFeedback.value?.isCorrect).toBe(true)
        expect(session.lastFeedback.value?.matchedType).toBe('hiragana')
      }
    })

    it('rejects incorrect romaji for hiragana entry', () => {
      const session = useStudySession('hiragana')
      session.startSession()

      session.submitAnswer('invalid_romaji_xyz')
      expect(session.phase.value).toBe('answer')
      expect(session.lastFeedback.value?.isCorrect).toBe(false)
    })
  })
})
