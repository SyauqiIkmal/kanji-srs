<template>
  <div class="flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/60 w-fit">
    <button
      v-for="deck in decks"
      :key="deck.id"
      class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
      :class="[
        activeDeck === deck.id
          ? 'bg-card text-foreground shadow-sm border border-border'
          : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
      ]"
      :title="`Switch to ${deck.label}`"
      @click="setDeck(deck.id)"
    >
      <span class="text-base leading-none">{{ deck.icon }}</span>
      <span class="hidden sm:inline">{{ deck.label }}</span>
      <span
        class="hidden md:inline-flex items-center justify-center rounded-full text-[10px] font-mono px-1.5 py-0.5 min-w-[1.5rem]"
        :class="[
          activeDeck === deck.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        ]"
      >
        {{ deck.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DeckId } from '~/types'

const progress = useProgressStore()
const { totalCount: kanjiTotal } = useKanji()
const { totalCount: hiraganaTotal } = useHiragana()

const activeDeck = computed(() => progress.settings.activeDeck)

const decks = computed(() => [
  { id: 'kanji' as DeckId, icon: '🈁', label: 'Kanji N5', count: kanjiTotal },
  { id: 'hiragana' as DeckId, icon: '🅰', label: 'Hiragana', count: hiraganaTotal },
])

function setDeck(deckId: DeckId) {
  progress.updateSettings({ activeDeck: deckId })
}
</script>
