<template>
  <div class="space-y-6">
    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search kanji, reading, or meaning..."
          class="w-full pl-9 pr-4 py-2 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          @click="searchQuery = ''"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
        <button
          v-for="filter in filterOptions"
          :key="filter.id"
          class="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            activeFilter === filter.id
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'bg-secondary text-secondary-foreground hover:bg-muted',
          ]"
          @click="activeFilter = filter.id"
        >
          {{ filter.label }} ({{ filter.count }})
        </button>
      </div>
    </div>

    <!-- Kanji Cards Grid -->
    <div
      v-if="filteredKanji.length > 0"
      class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3"
    >
      <button
        v-for="item in filteredKanji"
        :key="item.char"
        class="group relative flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-secondary/40 transition-all text-center"
        @click="selectedKanji = item"
      >
        <!-- Status Indicator Badge -->
        <span
          class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
          :class="getStatusBadgeClass(item.char)"
          :title="getStatusLabel(item.char)"
        />

        <!-- Character -->
        <span
          class="font-jp text-3xl sm:text-4xl text-foreground group-hover:scale-110 transition-transform"
        >
          {{ item.char }}
        </span>

        <!-- Primary Meaning preview -->
        <span class="text-[11px] text-muted-foreground truncate max-w-full mt-1.5">
          {{ item.meanings[0] }}
        </span>
      </button>
    </div>

    <!-- Empty Filter State -->
    <div v-else class="rounded-lg border border-border bg-card p-12 text-center space-y-3">
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"
      >
        <SearchX class="h-6 w-6" />
      </div>
      <h3 class="text-base font-semibold text-foreground">No Kanji Found</h3>
      <p class="text-xs text-muted-foreground max-w-xs mx-auto">
        No characters matched your query "{{ searchQuery }}" in category "{{ activeFilter }}".
      </p>
      <button
        class="px-4 py-1.5 text-xs font-medium text-primary hover:underline"
        @click="resetFilters"
      >
        Reset Filters
      </button>
    </div>

    <!-- Kanji Detail Dialog -->
    <Dialog :open="!!selectedKanji" @update:open="(val) => !val && (selectedKanji = null)">
      <DialogContent v-if="selectedKanji" class="max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-baseline gap-3">
            <span class="font-jp text-5xl text-foreground leading-none">{{
              selectedKanji.char
            }}</span>
            <span class="text-lg font-normal text-muted-foreground">
              {{ selectedKanji.meanings.join(', ') }}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 pt-2">
          <!-- Status Badge & Metrics -->
          <div
            class="flex items-center justify-between p-3 rounded bg-secondary/50 border border-border text-xs"
          >
            <div class="flex items-center gap-2">
              <span
                class="h-2.5 w-2.5 rounded-full"
                :class="getStatusBadgeClass(selectedKanji.char)"
              />
              <span class="font-medium text-foreground">{{
                getStatusLabel(selectedKanji.char)
              }}</span>
            </div>
            <div
              v-if="getCardState(selectedKanji.char)"
              class="font-mono text-muted-foreground flex gap-3"
            >
              <span>Stab: {{ getCardState(selectedKanji.char)?.stability.toFixed(1) }}d</span>
              <span>Diff: {{ getCardState(selectedKanji.char)?.difficulty.toFixed(1) }}</span>
            </div>
          </div>

          <!-- Readings -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <span class="text-[11px] font-semibold uppercase text-muted-foreground"
                >On'yomi (音読み)</span
              >
              <p class="text-sm font-jp font-medium text-foreground">
                {{ selectedKanji.onyomi.length ? selectedKanji.onyomi.join('、') : '-' }}
              </p>
            </div>
            <div class="space-y-1">
              <span class="text-[11px] font-semibold uppercase text-muted-foreground"
                >Kun'yomi (訓読み)</span
              >
              <p class="text-sm font-jp font-medium text-foreground">
                {{ selectedKanji.kunyomi.length ? selectedKanji.kunyomi.join('、') : '-' }}
              </p>
            </div>
          </div>

          <!-- Metadata -->
          <div
            class="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border"
          >
            <span
              >Strokes:
              <strong class="text-foreground font-mono">{{
                selectedKanji.strokeCount
              }}</strong></span
            >
            <span
              >Grade:
              <strong class="text-foreground font-mono">{{
                selectedKanji.grade ?? '-'
              }}</strong></span
            >
            <span
              >Freq:
              <strong class="text-foreground font-mono">{{
                selectedKanji.frequency ?? '-'
              }}</strong></span
            >
          </div>

          <!-- Example Words -->
          <div v-if="selectedKanji.examples.length" class="space-y-2 pt-1">
            <span class="text-[11px] font-semibold uppercase text-muted-foreground"
              >N5 Vocabulary Examples</span
            >
            <div class="grid gap-2">
              <div
                v-for="(ex, idx) in selectedKanji.examples"
                :key="idx"
                class="p-2.5 rounded border border-border bg-card flex items-baseline justify-between gap-2"
              >
                <div class="flex items-baseline gap-2">
                  <span class="font-jp text-base font-semibold text-foreground">{{ ex.word }}</span>
                  <span class="font-jp text-xs text-muted-foreground">({{ ex.reading }})</span>
                </div>
                <span class="text-xs text-muted-foreground">{{ ex.meaning }}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Search, SearchX, X } from 'lucide-vue-next'
import { State } from 'ts-fsrs'
import type { KanjiEntry } from '~/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const progress = useProgressStore()
const { allKanji } = useKanji()

type FilterMode = 'all' | 'new' | 'learning' | 'review' | 'due'

const searchQuery = ref('')
const activeFilter = ref<FilterMode>('all')
const selectedKanji = ref<KanjiEntry | null>(null)

const dueSet = computed(() => new Set(progress.dueToday))

const filterOptions = computed<{ id: FilterMode; label: string; count: number }[]>(() => [
  { id: 'all', label: 'All', count: allKanji.value.length },
  {
    id: 'new',
    label: 'New',
    count: allKanji.value.filter((k) => progress.isNew(k.char)).length,
  },
  {
    id: 'learning',
    label: 'Learning',
    count: allKanji.value.filter((k) => {
      const card = progress.cards[k.char]
      return card && (card.state === State.Learning || card.state === State.Relearning)
    }).length,
  },
  {
    id: 'review',
    label: 'Review',
    count: allKanji.value.filter((k) => {
      const card = progress.cards[k.char]
      return card && card.state === State.Review
    }).length,
  },
  {
    id: 'due',
    label: 'Due Today',
    count: dueSet.value.size,
  },
])

const filteredKanji = computed(() => {
  return allKanji.value.filter((k) => {
    // 1. Category Filter
    if (activeFilter.value === 'new' && !progress.isNew(k.char)) return false
    if (activeFilter.value === 'due' && !dueSet.value.has(k.char)) return false

    const card = progress.cards[k.char]
    if (
      activeFilter.value === 'learning' &&
      (!card || (card.state !== State.Learning && card.state !== State.Relearning))
    ) {
      return false
    }
    if (activeFilter.value === 'review' && (!card || card.state !== State.Review)) {
      return false
    }

    // 2. Search Query Filter
    if (!searchQuery.value.trim()) return true
    const q = searchQuery.value.trim().toLowerCase()
    return (
      k.char.includes(q) ||
      k.meanings.some((m) => m.toLowerCase().includes(q)) ||
      k.onyomi.some((o) => o.includes(q)) ||
      k.kunyomi.some((u) => u.includes(q))
    )
  })
})

function getCardState(char: string) {
  return progress.cards[char]
}

function getStatusLabel(char: string): string {
  if (progress.isNew(char)) return 'New'
  const card = progress.cards[char]
  if (!card) return 'New'
  if (card.state === State.Learning || card.state === State.Relearning) return 'Learning'
  if (card.state === State.Review) return 'Review (Mastered)'
  return 'Studied'
}

function getStatusBadgeClass(char: string): string {
  if (progress.isNew(char)) return 'bg-muted-foreground/30'
  const card = progress.cards[char]
  if (!card) return 'bg-muted-foreground/30'
  if (card.state === State.Learning || card.state === State.Relearning) return 'bg-amber-500'
  if (card.state === State.Review) return 'bg-emerald-500'
  return 'bg-sky-500'
}

function resetFilters() {
  searchQuery.value = ''
  activeFilter.value = 'all'
}
</script>
