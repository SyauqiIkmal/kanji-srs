<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Active Session View -->
    <div v-if="phase === 'question' || phase === 'answer'" class="space-y-6">
      <!-- Session Header & Progress -->
      <div class="flex items-center justify-between">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          <span>Exit Session</span>
        </NuxtLink>

        <!-- Progress Indicator -->
        <div class="flex items-center gap-3">
          <div class="text-xs font-mono text-muted-foreground">
            Card <strong class="text-foreground">{{ currentIndex + 1 }}</strong> of {{ totalCards }}
          </div>
          <div class="h-2 w-24 bg-secondary rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-300"
              :style="{ width: `${((currentIndex + 1) / totalCards) * 100}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Main Study Card -->
      <div
        class="relative overflow-hidden rounded-lg border border-border bg-card p-8 sm:p-12 text-center transition-all duration-200"
        :class="{ 'ring-1 ring-primary/30': phase === 'question' }"
      >
        <!-- Hero Kanji Display -->
        <div class="py-4 flex justify-center items-center">
          <span
            class="font-jp text-[clamp(6rem,18vw,10rem)] leading-none text-foreground select-none"
          >
            {{ currentChar }}
          </span>
        </div>

        <!-- Question Mode: Tap / Space to reveal -->
        <div v-if="phase === 'question'" class="pt-6 border-t border-border/50">
          <button
            class="w-full py-3 px-6 rounded-md bg-secondary hover:bg-muted text-secondary-foreground font-medium text-sm transition-colors flex items-center justify-center gap-2 group"
            @click="revealAnswer"
          >
            <span>Show Answer</span>
            <kbd
              class="hidden sm:inline-block px-2 py-0.5 text-xs font-mono bg-background border border-border rounded text-muted-foreground group-hover:border-foreground/30"
            >
              Space
            </kbd>
          </button>
        </div>

        <!-- Answer Mode: Revealed Kanji Details -->
        <div
          v-else-if="phase === 'answer' && currentEntry"
          class="space-y-6 pt-6 border-t border-border text-left"
        >
          <!-- Meanings -->
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >Meaning</span
            >
            <p class="text-lg font-semibold text-foreground mt-0.5">
              {{ currentEntry.meanings.join(', ') }}
            </p>
          </div>

          <!-- Readings Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >On'yomi (音読み)</span
              >
              <p class="text-sm font-jp font-medium text-foreground">
                {{ currentEntry.onyomi.length ? currentEntry.onyomi.join('、') : '-' }}
              </p>
            </div>
            <div class="space-y-1">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >Kun'yomi (訓読み)</span
              >
              <p class="text-sm font-jp font-medium text-foreground">
                {{ currentEntry.kunyomi.length ? currentEntry.kunyomi.join('、') : '-' }}
              </p>
            </div>
          </div>

          <!-- Metadata & Examples -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span
                >Strokes:
                <strong class="text-foreground font-mono">{{
                  currentEntry.strokeCount
                }}</strong></span
              >
              <span
                >Grade:
                <strong class="text-foreground font-mono">{{
                  currentEntry.grade ?? '-'
                }}</strong></span
              >
            </div>

            <!-- Example Words -->
            <div v-if="currentEntry.examples.length" class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >Examples</span
              >
              <div class="grid gap-2 sm:grid-cols-2">
                <div
                  v-for="(ex, i) in currentEntry.examples"
                  :key="i"
                  class="p-2.5 rounded border border-border bg-secondary/50 flex flex-col"
                >
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="font-jp text-base font-semibold text-foreground">{{
                      ex.word
                    }}</span>
                    <span class="font-jp text-xs text-muted-foreground">{{ ex.reading }}</span>
                  </div>
                  <span class="text-xs text-muted-foreground mt-1">{{ ex.meaning }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FSRS Rating Buttons (Answer Phase) -->
      <div v-if="phase === 'answer'" class="grid grid-cols-4 gap-2 sm:gap-3">
        <button
          class="flex flex-col items-center justify-center p-3 rounded border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 hover:opacity-95 transition-all shadow-sm group"
          @click="handleGrade(Rating.Again)"
        >
          <span class="text-sm font-bold">Again</span>
          <span class="text-[10px] opacity-75 font-mono">Repeat</span>
          <kbd
            class="mt-1 px-1.5 py-0.5 text-[10px] font-mono border border-current/20 rounded opacity-60"
            >1</kbd
          >
        </button>

        <button
          class="flex flex-col items-center justify-center p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 hover:opacity-95 transition-all shadow-sm group"
          @click="handleGrade(Rating.Hard)"
        >
          <span class="text-sm font-bold">Hard</span>
          <span class="text-[10px] opacity-75 font-mono">Struggled</span>
          <kbd
            class="mt-1 px-1.5 py-0.5 text-[10px] font-mono border border-current/20 rounded opacity-60"
            >2</kbd
          >
        </button>

        <button
          class="flex flex-col items-center justify-center p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 hover:opacity-95 transition-all shadow-sm group"
          @click="handleGrade(Rating.Good)"
        >
          <span class="text-sm font-bold">Good</span>
          <span class="text-[10px] opacity-75 font-mono">Recalled</span>
          <kbd
            class="mt-1 px-1.5 py-0.5 text-[10px] font-mono border border-current/20 rounded opacity-60"
            >3</kbd
          >
        </button>

        <button
          class="flex flex-col items-center justify-center p-3 rounded border border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200 hover:opacity-95 transition-all shadow-sm group"
          @click="handleGrade(Rating.Easy)"
        >
          <span class="text-sm font-bold">Easy</span>
          <span class="text-[10px] opacity-75 font-mono">Instant</span>
          <kbd
            class="mt-1 px-1.5 py-0.5 text-[10px] font-mono border border-current/20 rounded opacity-60"
            >4</kbd
          >
        </button>
      </div>
    </div>

    <!-- Complete Screen -->
    <div
      v-else-if="phase === 'complete'"
      class="rounded-lg border border-border bg-card p-8 text-center space-y-6"
    >
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
      >
        <CheckCircle2 class="h-8 w-8" />
      </div>

      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-foreground">Session Complete!</h2>
        <p class="text-sm text-muted-foreground max-w-sm mx-auto">
          Awesome effort! You reviewed
          <strong class="text-foreground">{{ sessionCount }}</strong> cards in this session.
        </p>
      </div>

      <!-- Grade Breakdown Summary -->
      <div
        class="grid grid-cols-4 gap-2 max-w-sm mx-auto p-4 rounded-lg bg-secondary/50 border border-border"
      >
        <div class="text-center">
          <div class="text-xs text-muted-foreground font-medium">Again</div>
          <div class="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
            {{ sessionGrades[Rating.Again] }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground font-medium">Hard</div>
          <div class="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
            {{ sessionGrades[Rating.Hard] }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground font-medium">Good</div>
          <div class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {{ sessionGrades[Rating.Good] }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-muted-foreground font-medium">Easy</div>
          <div class="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
            {{ sessionGrades[Rating.Easy] }}
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <NuxtLink
          to="/"
          class="w-full sm:w-auto px-6 py-2.5 rounded text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </NuxtLink>
        <button
          class="w-full sm:w-auto px-6 py-2.5 rounded text-sm font-medium border border-border bg-secondary hover:bg-muted transition-colors"
          @click="startSession"
        >
          Study Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, CheckCircle2 } from 'lucide-vue-next'
import { Rating, type Grade } from 'ts-fsrs'

const {
  phase,
  currentIndex,
  sessionCount,
  sessionGrades,
  currentChar,
  currentEntry,
  totalCards,
  startSession,
  revealAnswer,
  grade,
} = useStudySession()

onMounted(() => {
  startSession()
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

function handleGrade(rating: Rating) {
  if (rating === Rating.Manual) return
  grade(rating as Grade)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  if (phase.value === 'question' && e.code === 'Space') {
    e.preventDefault()
    revealAnswer()
  } else if (phase.value === 'answer') {
    if (e.key === '1') {
      e.preventDefault()
      grade(Rating.Again as Grade)
    } else if (e.key === '2') {
      e.preventDefault()
      grade(Rating.Hard as Grade)
    } else if (e.key === '3') {
      e.preventDefault()
      grade(Rating.Good as Grade)
    } else if (e.key === '4') {
      e.preventDefault()
      grade(Rating.Easy as Grade)
    }
  }
}
</script>
