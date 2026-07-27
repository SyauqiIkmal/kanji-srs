<template>
  <div class="space-y-6">
    <!-- Deck Switcher -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <DeckSwitcher />
    </div>

    <!-- Hero Banner Card -->
    <div
      class="relative overflow-hidden rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm"
    >
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <!-- Deck Context Badge -->
          <div
            class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono font-medium border"
            :class="
              activeDeck === 'hiragana'
                ? 'border-violet-400/40 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                : 'border-primary/20 bg-primary/10 text-primary'
            "
          >
            <span>{{
              activeDeck === 'hiragana' ? 'Hiragana Syllabary' : 'JLPT N5 Collection'
            }}</span>
            <span>·</span>
            <span>{{ activeDeck === 'hiragana' ? hiraganaTotal : kanjiTotal }} Total</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <span v-if="dueCardsCount > 0">Ready for today's review?</span>
            <span v-else-if="newCardsAvailableCount > 0">{{
              activeDeck === 'hiragana' ? 'Learn new hiragana today!' : 'Learn new kanji today!'
            }}</span>
            <span v-else>All caught up for today!</span>
          </h1>
          <p class="text-sm text-muted-foreground leading-relaxed">
            <template v-if="dueCardsCount > 0">
              You have
              <strong class="text-foreground font-semibold">{{ dueCardsCount }}</strong> cards
              waiting for review. Keep your streak alive!
            </template>
            <template v-else-if="newCardsAvailableCount > 0">
              No reviews due! You can introduce up to
              <strong class="text-foreground font-semibold">{{ newCardsAvailableCount }}</strong>
              new {{ activeDeck === 'hiragana' ? 'hiragana' : 'kanji' }} today.
            </template>
            <template v-else>
              Great job! You've completed all reviews and new card intakes for today.
            </template>
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <NuxtLink
            to="/study"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Play class="h-4 w-4 fill-current" />
            <span>{{
              dueCardsCount > 0
                ? 'Start Review'
                : newCardsAvailableCount > 0
                  ? 'Start Learning'
                  : 'Practice Queue'
            }}</span>
          </NuxtLink>

          <NuxtLink
            to="/browse"
            class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded text-sm font-medium border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
          >
            <Layers class="h-4 w-4" />
            <span>{{ activeDeck === 'hiragana' ? 'Syllabary' : 'Browse All' }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Overview Metrics Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="rounded-lg border border-border bg-card p-4 space-y-1">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Due Today</span>
          <Clock class="h-4 w-4 text-amber-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground">{{ dueCardsCount }}</div>
        <p class="text-[11px] text-muted-foreground">Cards awaiting recall</p>
      </div>

      <div class="rounded-lg border border-border bg-card p-4 space-y-1">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">New Intake</span>
          <Sparkles class="h-4 w-4 text-sky-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground">{{ newCardsAvailableCount }}</div>
        <p class="text-[11px] text-muted-foreground">Remaining today cap</p>
      </div>

      <div class="rounded-lg border border-border bg-card p-4 space-y-1">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Learning</span>
          <BookOpen class="h-4 w-4 text-emerald-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground">{{ learningCount }}</div>
        <p class="text-[11px] text-muted-foreground">In active learning</p>
      </div>

      <div class="rounded-lg border border-border bg-card p-4 space-y-1">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Mastered / Review</span>
          <CheckCircle2 class="h-4 w-4 text-indigo-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground">{{ reviewCount }}</div>
        <p class="text-[11px] text-muted-foreground">Graduated to review</p>
      </div>
    </div>

    <!-- Deck Progress Cards (side-by-side) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Kanji N5 Progress -->
      <div
        class="rounded-lg border bg-card p-5 space-y-3 transition-all"
        :class="
          activeDeck === 'kanji' ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'
        "
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">🈁</span>
              <h2 class="text-sm font-semibold text-foreground">Kanji N5</h2>
            </div>
            <p class="text-[11px] text-muted-foreground">Total studied at least once</p>
          </div>
          <div class="text-right">
            <span class="text-lg font-bold font-mono text-primary">{{
              progress.totalStudiedByDeck('kanji')
            }}</span>
            <span class="text-sm text-muted-foreground font-mono"> / {{ kanjiTotal }}</span>
          </div>
        </div>

        <div class="h-2.5 w-full bg-secondary rounded-full overflow-hidden flex">
          <div
            title="Review (Graduated)"
            class="bg-emerald-500 h-full transition-all duration-500"
            :style="{
              width: `${(progress.reviewCountByDeck('kanji') / kanjiTotal) * 100}%`,
            }"
          />
          <div
            title="Learning"
            class="bg-amber-500 h-full transition-all duration-500"
            :style="{
              width: `${(progress.learningCountByDeck('kanji') / kanjiTotal) * 100}%`,
            }"
          />
        </div>

        <div class="flex flex-wrap items-center text-[10px] text-muted-foreground gap-x-3 gap-y-1">
          <span class="flex items-center gap-1">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Review ({{ progress.reviewCountByDeck('kanji') }})</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="h-2 w-2 rounded-full bg-amber-500" />
            <span>Learning ({{ progress.learningCountByDeck('kanji') }})</span>
          </span>
          <span class="ml-auto font-mono">
            {{ Math.round((progress.totalStudiedByDeck('kanji') / kanjiTotal) * 100) }}%
          </span>
        </div>
      </div>

      <!-- Hiragana Progress -->
      <div
        class="rounded-lg border bg-card p-5 space-y-3 transition-all"
        :class="
          activeDeck === 'hiragana'
            ? 'border-violet-400/40 ring-1 ring-violet-400/20'
            : 'border-border'
        "
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">🅰</span>
              <h2 class="text-sm font-semibold text-foreground">Hiragana</h2>
            </div>
            <p class="text-[11px] text-muted-foreground">Total studied at least once</p>
          </div>
          <div class="text-right">
            <span class="text-lg font-bold font-mono text-violet-600 dark:text-violet-400">{{
              progress.totalStudiedByDeck('hiragana')
            }}</span>
            <span class="text-sm text-muted-foreground font-mono"> / {{ hiraganaTotal }}</span>
          </div>
        </div>

        <div class="h-2.5 w-full bg-secondary rounded-full overflow-hidden flex">
          <div
            title="Review (Graduated)"
            class="bg-emerald-500 h-full transition-all duration-500"
            :style="{
              width: `${(progress.reviewCountByDeck('hiragana') / hiraganaTotal) * 100}%`,
            }"
          />
          <div
            title="Learning"
            class="bg-amber-500 h-full transition-all duration-500"
            :style="{
              width: `${(progress.learningCountByDeck('hiragana') / hiraganaTotal) * 100}%`,
            }"
          />
        </div>

        <div class="flex flex-wrap items-center text-[10px] text-muted-foreground gap-x-3 gap-y-1">
          <span class="flex items-center gap-1">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Review ({{ progress.reviewCountByDeck('hiragana') }})</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="h-2 w-2 rounded-full bg-amber-500" />
            <span>Learning ({{ progress.learningCountByDeck('hiragana') }})</span>
          </span>
          <span class="ml-auto font-mono">
            {{ Math.round((progress.totalStudiedByDeck('hiragana') / hiraganaTotal) * 100) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Layers, Clock, Sparkles, BookOpen, CheckCircle2 } from 'lucide-vue-next'

const progress = useProgressStore()
const { kanjiList, totalCount: kanjiTotal } = useKanji()
const { charList: hiraganaCharList, totalCount: hiraganaTotal } = useHiragana()

const activeDeck = computed(() => progress.settings.activeDeck)

// Active deck metrics (reactive to deck switch)
const dueCardsCount = computed(() => progress.dueTodayByDeck(activeDeck.value).length)

const newCardsAvailableCount = computed(() => {
  const allChars = activeDeck.value === 'hiragana' ? [...hiraganaCharList] : [...kanjiList]
  return progress.getAvailableNewCards(activeDeck.value, allChars).length
})

const learningCount = computed(() => progress.learningCountByDeck(activeDeck.value))
const reviewCount = computed(() => progress.reviewCountByDeck(activeDeck.value))
</script>
