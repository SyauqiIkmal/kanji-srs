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
})
