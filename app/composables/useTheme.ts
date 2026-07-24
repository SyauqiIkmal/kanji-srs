/**
 * Composable for managing the color theme (light / dark / system).
 *
 * Reads the user's preference from the progress store and applies
 * the `dark` class to the document root.
 */

import { useProgressStore } from '~/stores/progress'

export function useTheme() {
  const progress = useProgressStore()

  const prefersDark = ref(false)

  /** The resolved theme after applying system preference. */
  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (progress.settings.theme === 'system') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return progress.settings.theme
  })

  const isDark = computed(() => resolvedTheme.value === 'dark')

  /** Apply the dark class to the document root. */
  function applyTheme() {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', isDark.value)
    }
  }

  /** Toggle between light and dark (sets explicit, not system). */
  function toggleTheme() {
    progress.updateSettings({
      theme: isDark.value ? 'light' : 'dark',
    })
  }

  /** Set a specific theme. */
  function setTheme(theme: 'light' | 'dark' | 'system') {
    progress.updateSettings({ theme })
  }

  // Watch for changes and apply
  if (import.meta.client) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = mediaQuery.matches

    mediaQuery.addEventListener('change', (e) => {
      prefersDark.value = e.matches
    })

    // Apply theme whenever it changes
    watch(isDark, () => applyTheme(), { immediate: true })
  }

  return {
    theme: computed(() => progress.settings.theme),
    resolvedTheme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
