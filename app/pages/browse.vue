<template>
  <div class="space-y-6">
    <!-- Deck Switcher -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <DeckSwitcher />
      <!-- Active deck context label -->
      <span class="text-xs text-muted-foreground">
        {{ activeDeck === 'kanji' ? '103 JLPT N5 Kanji' : '107 Hiragana characters' }}
      </span>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- KANJI BROWSE VIEW                                      -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <template v-if="activeDeck === 'kanji'">
      <!-- Search & Filter Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        data-testid="kanji-grid"
        class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3"
      >
        <button
          v-for="item in filteredKanji"
          :key="item.char"
          class="group relative flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-secondary/40 transition-all text-center"
          @click="openKanji(item)"
        >
          <span
            class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
            :class="getKanjiStatusBadgeClass(item.char)"
            :title="getKanjiStatusLabel(item.char)"
          />
          <span
            class="font-jp text-3xl sm:text-4xl text-foreground group-hover:scale-110 transition-transform"
          >
            {{ item.char }}
          </span>
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
            <DialogDescription class="sr-only">
              Kanji detail modal for {{ selectedKanji.char }}
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4 pt-2">
            <div
              class="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-lg border border-border bg-secondary/30"
            >
              <KanjiStrokeOrder :char="selectedKanji.char" class="shrink-0" />
              <div class="space-y-2 flex-1 w-full text-xs">
                <div
                  class="flex items-center justify-between p-2 rounded bg-card border border-border"
                >
                  <span class="text-muted-foreground font-medium">SRS Status</span>
                  <span class="font-semibold text-foreground flex items-center gap-1.5">
                    <span
                      class="h-2 w-2 rounded-full"
                      :class="getKanjiStatusBadgeClass(selectedKanji.char)"
                    />
                    {{ getKanjiStatusLabel(selectedKanji.char) }}
                  </span>
                </div>
                <div
                  v-if="getKanjiCardState(selectedKanji.char)"
                  class="space-y-1.5 p-2 rounded bg-card border border-border font-mono text-[11px]"
                >
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Stability:</span>
                    <span class="text-foreground font-bold"
                      >{{ getKanjiCardState(selectedKanji.char)?.stability.toFixed(1) }}d</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Difficulty:</span>
                    <span class="text-foreground font-bold">{{
                      getKanjiCardState(selectedKanji.char)?.difficulty.toFixed(1)
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Reviews:</span>
                    <span class="text-foreground font-bold">{{
                      getKanjiCardState(selectedKanji.char)?.reps
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

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
                    <span class="font-jp text-base font-semibold text-foreground">{{
                      ex.word
                    }}</span>
                    <span class="font-jp text-xs text-muted-foreground">({{ ex.reading }})</span>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ ex.meaning }}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </template>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- HIRAGANA BROWSE VIEW                                   -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <template v-else>
      <HiraganaGrid />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Search, SearchX, X } from 'lucide-vue-next'
import { State } from 'ts-fsrs'
import type { KanjiEntry } from '~/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const progress = useProgressStore()
const { allKanji } = useKanji()

const activeDeck = computed(() => progress.settings.activeDeck)

// ─── Kanji browse state ──────────────────────────────────────────

type FilterMode = 'all' | 'new' | 'learning' | 'review' | 'due'

const searchQuery = ref('')
const activeFilter = ref<FilterMode>('all')
const selectedKanji = ref<KanjiEntry | null>(null)

function openKanji(item: KanjiEntry) {
  selectedKanji.value = item
}

const dueSet = computed(() => new Set(progress.dueTodayByDeck('kanji')))

const filterOptions = computed<{ id: FilterMode; label: string; count: number }[]>(() => [
  { id: 'all', label: 'All', count: allKanji.value.length },
  {
    id: 'new',
    label: 'New',
    count: allKanji.value.filter((k) => progress.isNew('kanji', k.char)).length,
  },
  {
    id: 'learning',
    label: 'Learning',
    count: allKanji.value.filter((k) => {
      const card = progress.cards[`kanji:${k.char}`]
      return card && (card.state === State.Learning || card.state === State.Relearning)
    }).length,
  },
  {
    id: 'review',
    label: 'Review',
    count: allKanji.value.filter((k) => {
      const card = progress.cards[`kanji:${k.char}`]
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
    if (activeFilter.value === 'new' && !progress.isNew('kanji', k.char)) return false
    if (activeFilter.value === 'due' && !dueSet.value.has(k.char)) return false

    const card = progress.cards[`kanji:${k.char}`]
    if (
      activeFilter.value === 'learning' &&
      (!card || (card.state !== State.Learning && card.state !== State.Relearning))
    ) {
      return false
    }
    if (activeFilter.value === 'review' && (!card || card.state !== State.Review)) {
      return false
    }

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

function getKanjiCardState(char: string) {
  return progress.cards[`kanji:${char}`]
}

function getKanjiStatusLabel(char: string): string {
  if (progress.isNew('kanji', char)) return 'New'
  const card = progress.cards[`kanji:${char}`]
  if (!card) return 'New'
  if (card.state === State.Learning || card.state === State.Relearning) return 'Learning'
  if (card.state === State.Review) return 'Review (Mastered)'
  return 'Studied'
}

function getKanjiStatusBadgeClass(char: string): string {
  if (progress.isNew('kanji', char)) return 'bg-muted-foreground/30'
  const card = progress.cards[`kanji:${char}`]
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
