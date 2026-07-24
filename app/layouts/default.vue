<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground font-sans">
    <!-- Desktop & Mobile Header -->
    <header
      class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div
            class="flex h-9 w-9 items-center justify-center rounded border border-primary/20 bg-primary/10 text-primary font-jp text-xl font-medium transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          >
            漢
          </div>
          <div class="flex flex-col">
            <span class="font-bold tracking-tight text-base leading-none">Kanji SRS</span>
            <span class="text-[10px] text-muted-foreground font-mono mt-0.5">JLPT N5 · FSRS</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation Links -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground"
            :class="[
              route.path === item.path
                ? 'bg-secondary text-primary font-semibold'
                : 'text-muted-foreground',
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.badge && item.badge > 0"
              class="ml-1 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-primary text-primary-foreground"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </nav>

        <!-- Header Actions: Streak & Theme -->
        <div class="flex items-center gap-3">
          <!-- Streak Indicator -->
          <div
            title="Current Review Streak"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card text-xs font-mono font-semibold"
          >
            <span class="text-amber-500 animate-pulse">🔥</span>
            <span>{{ progress.streak }}</span>
            <span class="text-[10px] text-muted-foreground font-sans hidden sm:inline">days</span>
          </div>

          <!-- Theme Toggle Button -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
            :title="`Current theme: ${theme} (click to toggle)`"
            @click="cycleTheme"
          >
            <Sun v-if="resolvedTheme === 'light'" class="h-4 w-4 text-amber-600" />
            <Moon v-else class="h-4 w-4 text-sky-400" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 mb-16 md:mb-0">
      <slot />
    </main>

    <!-- Mobile Bottom Navigation Bar -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur px-2 py-1 flex justify-around items-center"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center py-1.5 px-3 rounded text-[11px] font-medium transition-colors"
        :class="[route.path === item.path ? 'text-primary font-bold' : 'text-muted-foreground']"
      >
        <div class="relative">
          <component :is="item.icon" class="h-5 w-5" />
          <span
            v-if="item.badge && item.badge > 0"
            class="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-mono font-bold rounded-full bg-primary text-primary-foreground"
          >
            {{ item.badge }}
          </span>
        </div>
        <span class="mt-1">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { LayoutDashboard, BookOpen, Layers, BarChart3, Sun, Moon } from 'lucide-vue-next'

const route = useRoute()
const progress = useProgressStore()
const { kanjiList } = useKanji()
const { theme, resolvedTheme, setTheme } = useTheme()

const dueCount = computed(() => progress.getStudyQueue([...kanjiList]).length)

const navItems = computed(() => [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Study', path: '/study', icon: BookOpen, badge: dueCount.value },
  { label: 'Browse', path: '/browse', icon: Layers },
  { label: 'Stats', path: '/stats', icon: BarChart3 },
])

function cycleTheme() {
  if (theme.value === 'light') setTheme('dark')
  else if (theme.value === 'dark') setTheme('system')
  else setTheme('light')
}
</script>
