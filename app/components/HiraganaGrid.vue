<template>
  <div class="space-y-6">
    <!-- Category Tabs -->
    <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
      <button
        v-for="tab in categoryTabs"
        :key="tab.id"
        class="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors"
        :class="[
          activeTab === tab.id
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'bg-secondary text-secondary-foreground hover:bg-muted',
        ]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Gojūon 5x10 Grid -->
    <div v-if="activeTab === 'gojuon'" class="space-y-2">
      <p class="text-xs text-muted-foreground">
        Traditional 5×10 syllabary chart. Columns: a · i · u · e · o
      </p>

      <!-- Column Header -->
      <div class="grid gap-1.5" style="grid-template-columns: repeat(5, 1fr)">
        <div
          v-for="col in ['a', 'i', 'u', 'e', 'o']"
          :key="col"
          class="text-center text-[10px] font-mono text-muted-foreground py-1 font-semibold uppercase tracking-wider"
        >
          {{ col }}
        </div>
      </div>

      <!-- Grid Rows -->
      <div
        v-for="(row, rowIdx) in gojuonGrid"
        :key="rowIdx"
        class="grid gap-1.5"
        style="grid-template-columns: repeat(5, 1fr)"
      >
        <button
          v-for="(entry, colIdx) in row"
          :key="colIdx"
          class="relative flex flex-col items-center justify-center gap-0.5 rounded-lg border p-2 transition-all"
          :class="[
            entry
              ? 'bg-card border-border hover:border-primary/50 hover:bg-secondary/40 cursor-pointer'
              : 'bg-transparent border-transparent cursor-default opacity-0 pointer-events-none',
          ]"
          :title="entry ? `${entry.char} (${entry.romaji})` : ''"
          @click="entry && openEntry(entry)"
        >
          <template v-if="entry">
            <!-- SRS Status Dot -->
            <span
              class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
              :class="getStatusBadgeClass(entry.char)"
            />
            <!-- Kana Character -->
            <span class="font-jp text-xl sm:text-2xl text-foreground leading-none">{{
              entry.char
            }}</span>
            <!-- Romaji sub-label -->
            <span class="text-[9px] font-mono text-muted-foreground">{{ entry.romaji }}</span>
          </template>
        </button>
      </div>

      <!-- ん standalone -->
      <div class="flex items-center gap-2 pt-1">
        <button
          v-if="nEntry"
          class="relative flex flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-secondary/40 transition-all p-2 w-[calc(20%-0.3rem)]"
          @click="openEntry(nEntry)"
        >
          <span
            class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            :class="getStatusBadgeClass('ん')"
          />
          <span class="font-jp text-xl sm:text-2xl text-foreground leading-none">ん</span>
          <span class="text-[9px] font-mono text-muted-foreground">n</span>
        </button>
        <span class="text-[10px] text-muted-foreground italic">Standalone nasal (ん)</span>
      </div>
    </div>

    <!-- Dakuon & Handakuon Grid -->
    <div v-else-if="activeTab === 'dakuon'" class="space-y-3">
      <p class="text-xs text-muted-foreground">
        Voiced (゛dakuten) and semi-voiced (゜handakuten) variants.
      </p>
      <div class="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        <button
          v-for="entry in dakuonEntries"
          :key="entry.char"
          class="relative flex flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-secondary/40 transition-all p-2"
          @click="openEntry(entry)"
        >
          <span
            class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            :class="getStatusBadgeClass(entry.char)"
          />
          <span class="font-jp text-xl sm:text-2xl text-foreground leading-none">{{
            entry.char
          }}</span>
          <span class="text-[9px] font-mono text-muted-foreground">{{ entry.romaji }}</span>
        </button>
      </div>
    </div>

    <!-- Yōon Grid -->
    <div v-else-if="activeTab === 'yoon'" class="space-y-3">
      <p class="text-xs text-muted-foreground">
        Contracted sounds — small や, ゆ, よ combined with i-row consonants.
      </p>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        <button
          v-for="entry in yoonEntries"
          :key="entry.char"
          class="relative flex flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-secondary/40 transition-all p-2"
          @click="openEntry(entry)"
        >
          <span
            class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            :class="getStatusBadgeClass(entry.char)"
          />
          <span class="font-jp text-xl sm:text-2xl text-foreground leading-none">{{
            entry.char
          }}</span>
          <span class="text-[9px] font-mono text-muted-foreground">{{ entry.romaji }}</span>
        </button>
      </div>
    </div>

    <!-- Hiragana Detail Modal -->
    <Dialog :open="!!selectedEntry" @update:open="(val) => !val && (selectedEntry = null)">
      <DialogContent v-if="selectedEntry" class="max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-baseline gap-3">
            <span class="font-jp text-5xl text-foreground leading-none">{{
              selectedEntry.char
            }}</span>
            <div class="space-y-0.5">
              <span class="text-lg font-mono font-normal text-primary">{{
                selectedEntry.romaji
              }}</span>
              <div v-if="selectedEntry.altRomaji?.length" class="flex items-center gap-1">
                <span class="text-xs text-muted-foreground">also:</span>
                <span
                  v-for="alt in selectedEntry.altRomaji"
                  :key="alt"
                  class="text-xs font-mono text-muted-foreground"
                  >{{ alt }}</span
                >
              </div>
            </div>
          </DialogTitle>
          <DialogDescription class="sr-only">
            Hiragana detail for {{ selectedEntry.char }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 pt-2">
          <!-- Stroke Order & SRS Status -->
          <div
            class="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-lg border border-border bg-secondary/30"
          >
            <KanjiStrokeOrder :char="selectedEntry.char" class="shrink-0" />

            <div class="space-y-2 flex-1 w-full text-xs">
              <!-- Category Badge -->
              <div
                class="flex items-center justify-between p-2 rounded bg-card border border-border"
              >
                <span class="text-muted-foreground font-medium">Category</span>
                <span class="font-semibold text-foreground capitalize">{{
                  categoryLabel(selectedEntry.category)
                }}</span>
              </div>

              <!-- SRS Status -->
              <div
                class="flex items-center justify-between p-2 rounded bg-card border border-border"
              >
                <span class="text-muted-foreground font-medium">SRS Status</span>
                <span class="font-semibold text-foreground flex items-center gap-1.5">
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="getStatusBadgeClass(selectedEntry.char)"
                  />
                  {{ getStatusLabel(selectedEntry.char) }}
                </span>
              </div>

              <!-- FSRS metrics if studied -->
              <div
                v-if="getCardState(selectedEntry.char)"
                class="space-y-1.5 p-2 rounded bg-card border border-border font-mono text-[11px]"
              >
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Stability:</span>
                  <span class="text-foreground font-bold"
                    >{{ getCardState(selectedEntry.char)?.stability.toFixed(1) }}d</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Reviews:</span>
                  <span class="text-foreground font-bold">{{
                    getCardState(selectedEntry.char)?.reps
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Mnemonic -->
          <div
            v-if="selectedEntry.mnemonic"
            class="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30"
          >
            <p class="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">💡 Mnemonic</p>
            <p class="text-sm text-amber-900 dark:text-amber-200 italic">
              {{ selectedEntry.mnemonic }}
            </p>
          </div>

          <!-- Example Words -->
          <div v-if="selectedEntry.examples.length" class="space-y-2">
            <span class="text-[11px] font-semibold uppercase text-muted-foreground"
              >N5 Vocabulary Examples</span
            >
            <div class="grid gap-2">
              <div
                v-for="(ex, idx) in selectedEntry.examples"
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
import { State } from 'ts-fsrs'
import type { HiraganaEntry } from '~/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

type TabId = 'gojuon' | 'dakuon' | 'yoon'

const progress = useProgressStore()
const { gojuonGrid, dakuon, handakuon, yoon, lookup } = useHiragana()

const activeTab = ref<TabId>('gojuon')
const selectedEntry = ref<HiraganaEntry | null>(null)

const categoryTabs = [
  { id: 'gojuon' as TabId, label: 'Gojūon (46)' },
  { id: 'dakuon' as TabId, label: 'Dakuon + Handakuon (25)' },
  { id: 'yoon' as TabId, label: 'Yōon (36)' },
]

// Combine dakuon + handakuon for the second tab
const dakuonEntries = computed(() => [...dakuon.value, ...handakuon.value])
const yoonEntries = computed(() => yoon.value)
const nEntry = computed(() => lookup('ん'))

function openEntry(entry: HiraganaEntry) {
  selectedEntry.value = entry
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    gojuon: 'Gojūon (Basic)',
    dakuon: 'Dakuon (Voiced)',
    handakuon: 'Handakuon (Semi-voiced)',
    yoon: 'Yōon (Contracted)',
  }
  return map[cat] ?? cat
}

function getCardState(char: string) {
  return progress.cards[`hiragana:${char}`]
}

function getStatusLabel(char: string): string {
  const card = getCardState(char)
  if (!card) return 'New'
  if (card.state === State.Learning || card.state === State.Relearning) return 'Learning'
  if (card.state === State.Review) return 'Review (Mastered)'
  return 'Studied'
}

function getStatusBadgeClass(char: string): string {
  const card = getCardState(char)
  if (!card) return 'bg-muted-foreground/30'
  if (card.state === State.Learning || card.state === State.Relearning) return 'bg-amber-500'
  if (card.state === State.Review) return 'bg-emerald-500'
  return 'bg-sky-500'
}
</script>
