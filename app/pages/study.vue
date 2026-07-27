<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Deck Switcher (only on idle/complete screens) -->
    <div v-if="phase === 'idle' || phase === 'complete'" class="flex justify-center">
      <DeckSwitcher />
    </div>

    <!-- Active Session View -->
    <div v-if="phase === 'question' || phase === 'answer'" class="space-y-6">
      <!-- Session Header & Progress -->
      <div class="flex items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          <span>Exit Session</span>
        </NuxtLink>

        <!-- Deck Badge + Mode Toggle + Progress Indicator -->
        <div class="flex items-center gap-3">
          <!-- Active Deck Badge -->
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
            :class="
              activeDeck === 'hiragana'
                ? 'border-violet-400/40 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                : 'border-primary/20 bg-primary/10 text-primary'
            "
          >
            <span>{{ activeDeck === 'hiragana' ? '🅰 Hiragana' : '🈁 Kanji N5' }}</span>
          </span>

          <!-- Input Mode Quick Toggle -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-border bg-secondary/80 hover:bg-muted text-secondary-foreground transition-colors"
            :title="
              progressStore.settings.answerInputMode === 'romaji'
                ? 'Romaji input enabled. Click to switch to Flip mode'
                : 'Flip card mode enabled. Click to switch to Romaji input'
            "
            @click="toggleInputMode"
          >
            <Keyboard
              v-if="progressStore.settings.answerInputMode === 'romaji'"
              class="h-3.5 w-3.5 text-primary"
            />
            <Eye v-else class="h-3.5 w-3.5 text-muted-foreground" />
            <span>{{
              progressStore.settings.answerInputMode === 'romaji' ? 'Type Romaji' : 'Flip Mode'
            }}</span>
          </button>

          <div class="text-xs font-mono text-muted-foreground hidden sm:block">
            Card <strong class="text-foreground">{{ currentIndex + 1 }}</strong> of {{ totalCards }}
          </div>
          <div class="h-2 w-20 sm:w-24 bg-secondary rounded-full overflow-hidden shrink-0">
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
        <!-- Hero Character Display -->
        <div class="py-4 flex justify-center items-center">
          <span
            class="font-jp text-[clamp(6rem,18vw,10rem)] leading-none text-foreground select-none"
          >
            {{ currentChar }}
          </span>
        </div>

        <!-- Question Mode: Input Field or Flip Button -->
        <div v-if="phase === 'question'" class="pt-6 border-t border-border/50 space-y-3">
          <!-- Romaji Text Input Mode -->
          <div v-if="progressStore.settings.answerInputMode === 'romaji'" class="space-y-3">
            <form class="flex items-center gap-2" @submit.prevent="handleAnswerSubmit">
              <input
                ref="answerInputRef"
                v-model="inputAnswer"
                type="text"
                :placeholder="
                  activeDeck === 'hiragana'
                    ? 'Type romaji (e.g. ka, shi, kya)...'
                    : 'Type Romaji reading (e.g. yasui)...'
                "
                class="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                @keydown.esc="onEscKey"
              />
              <button
                type="submit"
                class="px-5 py-2.5 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                Check
              </button>
            </form>

            <div class="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>
                Press
                <kbd class="px-1 py-0.5 font-mono bg-muted border border-border rounded text-[10px]"
                  >Enter</kbd
                >
                to check
              </span>
              <button
                type="button"
                class="hover:text-foreground transition-colors inline-flex items-center gap-1"
                @click="onSkip"
              >
                <span>Skip</span>
                <kbd class="px-1 py-0.5 font-mono bg-muted border border-border rounded text-[10px]"
                  >Esc</kbd
                >
              </button>
            </div>
          </div>

          <!-- Traditional Flip Card Mode -->
          <button
            v-else
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

        <!-- Answer Mode: Revealed Card Details -->
        <div
          v-else-if="phase === 'answer' && currentEntry"
          class="space-y-6 pt-6 border-t border-border text-left"
        >
          <!-- Answer Feedback Banner -->
          <div
            v-if="lastFeedback"
            class="p-3.5 rounded-lg border text-sm flex items-start gap-3 transition-all"
            :class="
              lastFeedback.isCorrect
                ? 'border-emerald-500/40 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-500/40 bg-rose-50/70 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200'
            "
          >
            <CheckCircle2
              v-if="lastFeedback.isCorrect"
              class="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            />
            <XCircle v-else class="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />

            <div class="space-y-0.5 flex-1">
              <div class="font-semibold text-sm">
                {{ lastFeedback.isCorrect ? 'Correct!' : 'Incorrect' }}
              </div>
              <p class="text-xs opacity-90">
                <template v-if="lastFeedback.isCorrect">
                  You typed
                  <code class="font-mono px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded">{{
                    lastFeedback.userTyped
                  }}</code>
                  — Matches
                  <template v-if="lastFeedback.matchedType === 'hiragana'">
                    romaji
                    <span class="font-mono font-semibold">{{ lastFeedback.matchedReading }}</span>
                  </template>
                  <template v-else>
                    {{ lastFeedback.matchedType === 'onyomi' ? "On'yomi" : "Kun'yomi" }}:
                    <span class="font-jp font-semibold">{{ lastFeedback.matchedReading }}</span>
                  </template>
                </template>
                <template v-else>
                  You typed
                  <code class="font-mono px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded">{{
                    lastFeedback.userTyped || '(empty)'
                  }}</code>
                  — Expected:
                  <span class="font-jp font-semibold">
                    {{ expectedAnswer }}
                  </span>
                </template>
              </p>
            </div>
          </div>

          <!-- Hiragana Answer Details -->
          <template v-if="activeDeck === 'hiragana' && currentHiraganaEntry">
            <div class="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div class="space-y-4 flex-1">
                <!-- Romaji -->
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >Romaji</span
                  >
                  <p class="text-2xl font-mono font-semibold text-primary mt-0.5">
                    {{ currentHiraganaEntry.romaji }}
                    <span
                      v-if="currentHiraganaEntry.altRomaji?.length"
                      class="text-sm font-normal text-muted-foreground ml-2"
                    >
                      (also: {{ currentHiraganaEntry.altRomaji.join(', ') }})
                    </span>
                  </p>
                </div>

                <!-- Category -->
                <div>
                  <span
                    class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >Type</span
                  >
                  <p class="text-sm font-medium text-foreground mt-0.5 capitalize">
                    {{ currentHiraganaEntry.category }}
                  </p>
                </div>

                <!-- Mnemonic -->
                <div
                  v-if="currentHiraganaEntry.mnemonic"
                  class="p-2.5 rounded-md bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30"
                >
                  <span
                    class="text-[11px] font-semibold uppercase text-amber-700 dark:text-amber-400"
                    >💡 Mnemonic</span
                  >
                  <p class="text-sm italic text-amber-900 dark:text-amber-200 mt-0.5">
                    {{ currentHiraganaEntry.mnemonic }}
                  </p>
                </div>
              </div>

              <!-- Stroke Order -->
              <div v-if="currentChar" class="self-center sm:self-start shrink-0">
                <KanjiStrokeOrder :char="currentChar" :auto-play="true" />
              </div>
            </div>

            <!-- Examples -->
            <div v-if="currentHiraganaEntry.examples.length" class="space-y-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >Examples</span
              >
              <div class="grid gap-2 sm:grid-cols-2">
                <div
                  v-for="(ex, i) in currentHiraganaEntry.examples"
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
          </template>

          <!-- Kanji Answer Details -->
          <template v-else-if="activeDeck === 'kanji' && currentKanjiEntry">
            <div class="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div class="space-y-4 flex-1">
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >Meaning</span
                  >
                  <p class="text-lg font-semibold text-foreground mt-0.5">
                    {{ currentKanjiEntry.meanings.join(', ') }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <span
                      class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >On'yomi (音読み)</span
                    >
                    <p class="text-sm font-jp font-medium text-foreground">
                      {{
                        currentKanjiEntry.onyomi.length ? currentKanjiEntry.onyomi.join('、') : '-'
                      }}
                    </p>
                  </div>
                  <div class="space-y-1">
                    <span
                      class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >Kun'yomi (訓読み)</span
                    >
                    <p class="text-sm font-jp font-medium text-foreground">
                      {{
                        currentKanjiEntry.kunyomi.length
                          ? currentKanjiEntry.kunyomi.join('、')
                          : '-'
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="currentChar" class="self-center sm:self-start shrink-0">
                <KanjiStrokeOrder :char="currentChar" :auto-play="true" />
              </div>
            </div>

            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <span
                  >Strokes:
                  <strong class="text-foreground font-mono">{{
                    currentKanjiEntry.strokeCount
                  }}</strong></span
                >
                <span
                  >Grade:
                  <strong class="text-foreground font-mono">{{
                    currentKanjiEntry.grade ?? '-'
                  }}</strong></span
                >
              </div>

              <div v-if="currentKanjiEntry.examples.length" class="space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >Examples</span
                >
                <div class="grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="(ex, i) in currentKanjiEntry.examples"
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
          </template>
        </div>
      </div>

      <!-- FSRS Rating Buttons (Answer Phase) -->
      <div v-if="phase === 'answer'" class="grid grid-cols-4 gap-2 sm:gap-3">
        <button
          class="relative flex flex-col items-center justify-center p-3 rounded border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 hover:opacity-95 transition-all shadow-sm group"
          :class="{
            'ring-2 ring-rose-500 shadow-md font-bold scale-[1.02]':
              lastFeedback && !lastFeedback.isCorrect,
          }"
          @click="handleGrade(Rating.Again)"
        >
          <span
            v-if="lastFeedback && !lastFeedback.isCorrect"
            class="absolute -top-2 bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold tracking-wide"
          >
            Suggested
          </span>
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
          class="relative flex flex-col items-center justify-center p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 hover:opacity-95 transition-all shadow-sm group"
          :class="{
            'ring-2 ring-emerald-500 shadow-md font-bold scale-[1.02]':
              lastFeedback && lastFeedback.isCorrect,
          }"
          @click="handleGrade(Rating.Good)"
        >
          <span
            v-if="lastFeedback && lastFeedback.isCorrect"
            class="absolute -top-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold tracking-wide"
          >
            Suggested
          </span>
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

      <!-- Grade Breakdown -->
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
import { ArrowLeft, CheckCircle2, XCircle, Keyboard, Eye } from 'lucide-vue-next'
import { Rating, type Grade } from 'ts-fsrs'
import { useProgressStore } from '~/stores/progress'
import { isHiraganaEntry, isKanjiEntry } from '~/types'

const progressStore = useProgressStore()
const activeDeck = computed(() => progressStore.settings.activeDeck)

// Create both sessions upfront — composables can't be called inside computed()
const kanjiSession = useStudySession('kanji')
const hiraganaSession = useStudySession('hiragana')

// Dynamically pick the active session
const activeSession = computed(() =>
  activeDeck.value === 'hiragana' ? hiraganaSession : kanjiSession,
)

// Proxy the session API through computed refs so the template stays clean
const phase = computed(() => activeSession.value.phase.value)
const currentIndex = computed(() => activeSession.value.currentIndex.value)
const sessionCount = computed(() => activeSession.value.sessionCount.value)
const sessionGrades = computed(() => activeSession.value.sessionGrades.value)
const currentChar = computed(() => activeSession.value.currentChar.value)
const currentEntry = computed(() => activeSession.value.currentEntry.value)
const totalCards = computed(() => activeSession.value.totalCards.value)
const lastFeedback = computed(() => activeSession.value.lastFeedback.value)

function startSession() {
  activeSession.value.startSession()
}
function submitAnswer(input: string) {
  activeSession.value.submitAnswer(input)
}
function revealAnswer() {
  activeSession.value.revealAnswer()
}
function grade(rating: Grade) {
  activeSession.value.grade(rating)
}

// Typed convenience accessors for the template
const currentKanjiEntry = computed(() =>
  currentEntry.value && isKanjiEntry(currentEntry.value) ? currentEntry.value : null,
)
const currentHiraganaEntry = computed(() =>
  currentEntry.value && isHiraganaEntry(currentEntry.value) ? currentEntry.value : null,
)

/** Expected answer text for the "Incorrect" feedback banner. */
const expectedAnswer = computed(() => {
  if (!currentEntry.value) return ''
  if (isHiraganaEntry(currentEntry.value)) {
    const alts = currentEntry.value.altRomaji?.join(' / ') ?? ''
    return alts ? `${currentEntry.value.romaji} (or ${alts})` : currentEntry.value.romaji
  }
  return [...currentEntry.value.onyomi, ...currentEntry.value.kunyomi].join('、')
})

const inputAnswer = ref('')
const answerInputRef = ref<HTMLInputElement | null>(null)

function focusInput() {
  nextTick(() => {
    answerInputRef.value?.focus()
  })
}

watch(
  [phase, currentChar],
  ([newPhase]) => {
    if (newPhase === 'question') {
      inputAnswer.value = ''
      focusInput()
    }
  },
  { immediate: true },
)

// Restart session when deck changes
watch(activeDeck, () => {
  startSession()
})

onMounted(() => {
  startSession()
  focusInput()
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

function toggleInputMode() {
  const currentMode = progressStore.settings.answerInputMode
  progressStore.updateSettings({
    answerInputMode: currentMode === 'romaji' ? 'disabled' : 'romaji',
  })
  if (progressStore.settings.answerInputMode === 'romaji' && phase.value === 'question') {
    focusInput()
  }
}

function handleAnswerSubmit() {
  submitAnswer(inputAnswer.value)
  inputAnswer.value = ''
}

function onEscKey(e: KeyboardEvent) {
  e.preventDefault()
  onSkip()
}

function onSkip() {
  inputAnswer.value = ''
  revealAnswer()
}

function handleGrade(rating: Rating) {
  if (rating === Rating.Manual) return
  grade(rating as Grade)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  if (phase.value === 'question') {
    if (e.code === 'Space') {
      e.preventDefault()
      onSkip()
    }
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
