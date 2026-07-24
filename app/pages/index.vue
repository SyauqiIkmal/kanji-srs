<template>
  <div class="space-y-6">
    <!-- Hero Banner Card -->
    <div
      class="relative overflow-hidden rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm"
    >
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <div
            class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono font-medium border border-primary/20 bg-primary/10 text-primary"
          >
            <span>JLPT N5 Collection</span>
            <span>·</span>
            <span>{{ totalCount }} Kanji Total</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <span v-if="dueCardsCount > 0">Ready for today's review?</span>
            <span v-else-if="newCardsAvailableCount > 0">Learn new kanji today!</span>
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
              new kanji today.
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
            <span>Browse All</span>
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
        <div class="text-2xl font-bold font-mono text-foreground">{{ progress.learningCount }}</div>
        <p class="text-[11px] text-muted-foreground">In active learning</p>
      </div>

      <div class="rounded-lg border border-border bg-card p-4 space-y-1">
        <div class="flex items-center justify-between text-muted-foreground">
          <span class="text-xs font-medium">Mastered / Review</span>
          <CheckCircle2 class="h-4 w-4 text-indigo-500" />
        </div>
        <div class="text-2xl font-bold font-mono text-foreground">{{ progress.reviewCount }}</div>
        <p class="text-[11px] text-muted-foreground">Graduated to review</p>
      </div>
    </div>

    <!-- Overall Progress Card -->
    <div class="rounded-lg border border-border bg-card p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-foreground">N5 Mastery Progress</h2>
          <p class="text-xs text-muted-foreground">Total kanji studied at least once</p>
        </div>
        <div class="text-right">
          <span class="text-lg font-bold font-mono text-primary">{{ progress.totalStudied }}</span>
          <span class="text-sm text-muted-foreground font-mono"> / {{ totalCount }}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
        <div
          title="Review (Graduated)"
          class="bg-emerald-500 h-full transition-all duration-500"
          :style="{ width: `${(progress.reviewCount / totalCount) * 100}%` }"
        />
        <div
          title="Learning"
          class="bg-amber-500 h-full transition-all duration-500"
          :style="{ width: `${(progress.learningCount / totalCount) * 100}%` }"
        />
        <div
          title="New"
          class="bg-muted h-full transition-all duration-500"
          :style="{ width: `${((totalCount - progress.totalStudied) / totalCount) * 100}%` }"
        />
      </div>

      <!-- Legend -->
      <div
        class="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 pt-1"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Review ({{ progress.reviewCount }})</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Learning ({{ progress.learningCount }})</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-full bg-secondary border border-border" />
            <span>Unstudied ({{ totalCount - progress.totalStudied }})</span>
          </span>
        </div>

        <span class="font-mono text-[11px]">
          {{ Math.round((progress.totalStudied / totalCount) * 100) }}% Coverage
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Layers, Clock, Sparkles, BookOpen, CheckCircle2 } from 'lucide-vue-next'

const progress = useProgressStore()
const { kanjiList, totalCount } = useKanji()

const dueCardsCount = computed(() => progress.dueToday.length)
const newCardsAvailableCount = computed(() => progress.getAvailableNewCards([...kanjiList]).length)
</script>
