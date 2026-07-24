<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <!-- Page Title -->
    <div>
      <h1 class="text-2xl font-bold text-foreground">Statistics & Settings</h1>
      <p class="text-xs text-muted-foreground mt-1">
        Track memory retention, activity history, and configure FSRS parameters.
      </p>
    </div>

    <!-- Metrics Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-lg border border-border bg-card space-y-1">
        <span class="text-xs text-muted-foreground font-medium">Retention Rate</span>
        <div class="text-2xl font-bold font-mono text-foreground">
          {{ retentionPercentage }}
        </div>
        <p class="text-[11px] text-muted-foreground">
          Target: {{ (progress.settings.requestRetention * 100).toFixed(0) }}%
        </p>
      </div>

      <div class="p-4 rounded-lg border border-border bg-card space-y-1">
        <span class="text-xs text-muted-foreground font-medium">Current Streak</span>
        <div class="text-2xl font-bold font-mono text-amber-500">
          🔥 {{ progress.streak }} <span class="text-xs text-muted-foreground font-sans">days</span>
        </div>
        <p class="text-[11px] text-muted-foreground">Consecutive study days</p>
      </div>

      <div class="p-4 rounded-lg border border-border bg-card space-y-1">
        <span class="text-xs text-muted-foreground font-medium">Total Reviews Logged</span>
        <div class="text-2xl font-bold font-mono text-foreground">
          {{ progress.log.length }}
        </div>
        <p class="text-[11px] text-muted-foreground">Lifetime recall attempts</p>
      </div>

      <div class="p-4 rounded-lg border border-border bg-card space-y-1">
        <span class="text-xs text-muted-foreground font-medium">Kanji Coverage</span>
        <div class="text-2xl font-bold font-mono text-foreground">
          {{ progress.totalStudied }}
          <span class="text-xs text-muted-foreground font-sans">/ {{ totalCount }}</span>
        </div>
        <p class="text-[11px] text-muted-foreground">
          {{ Math.round((progress.totalStudied / totalCount) * 100) }}% deck introduced
        </p>
      </div>
    </div>

    <!-- 30-Day Due Forecast -->
    <div class="p-6 rounded-lg border border-border bg-card space-y-4">
      <div>
        <h2 class="text-base font-semibold text-foreground">30-Day Review Forecast</h2>
        <p class="text-xs text-muted-foreground">
          Scheduled reviews per day based on FSRS intervals
        </p>
      </div>

      <div class="h-32 flex items-end gap-1 pt-4 border-b border-border">
        <div
          v-for="(day, idx) in forecastDays"
          :key="idx"
          class="flex-1 flex flex-col items-center group relative h-full justify-end"
        >
          <!-- Bar -->
          <div
            class="w-full bg-primary/80 group-hover:bg-primary rounded-t transition-all min-h-[2px]"
            :style="{ height: `${Math.max(2, (day.count / maxForecastCount) * 100)}%` }"
          />
          <!-- Tooltip -->
          <div
            class="absolute bottom-full mb-1 hidden group-hover:block z-10 px-2 py-1 bg-popover text-popover-foreground border border-border rounded text-[10px] font-mono whitespace-nowrap shadow-sm"
          >
            {{ day.date }}: {{ day.count }} due
          </div>
        </div>
      </div>
      <div class="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>Today</span>
        <span>+15 Days</span>
        <span>+30 Days</span>
      </div>
    </div>

    <!-- Settings Section -->
    <div class="p-6 rounded-lg border border-border bg-card space-y-6">
      <div>
        <h2 class="text-base font-semibold text-foreground">Study & FSRS Settings</h2>
        <p class="text-xs text-muted-foreground">
          Configure review queue limits and target retention parameters
        </p>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <!-- New Cards Per Day -->
        <div class="space-y-2">
          <label class="text-xs font-semibold text-foreground flex justify-between">
            <span>New Cards Intake Cap (per day)</span>
            <span class="font-mono text-primary">{{ localSettings.newCardsPerDay }}</span>
          </label>
          <input
            v-model.number="localSettings.newCardsPerDay"
            type="range"
            min="1"
            max="25"
            step="1"
            class="w-full accent-primary"
            @change="saveSettings"
          />
          <p class="text-[11px] text-muted-foreground">Number of new kanji introduced each day</p>
        </div>

        <!-- Target Retention -->
        <div class="space-y-2">
          <label class="text-xs font-semibold text-foreground flex justify-between">
            <span>Target Retention Rate</span>
            <span class="font-mono text-primary"
              >{{ (localSettings.requestRetention * 100).toFixed(0) }}%</span
            >
          </label>
          <input
            v-model.number="localSettings.requestRetention"
            type="range"
            min="0.7"
            max="0.95"
            step="0.01"
            class="w-full accent-primary"
            @change="saveSettings"
          />
          <p class="text-[11px] text-muted-foreground">
            Higher retention increases daily review frequency
          </p>
        </div>
      </div>
    </div>

    <!-- Data Management (Import / Export / Reset) -->
    <div class="p-6 rounded-lg border border-border bg-card space-y-4">
      <div>
        <h2 class="text-base font-semibold text-foreground">Data Backup & Management</h2>
        <p class="text-xs text-muted-foreground">
          Export progress as JSON or import existing backup
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="px-4 py-2 rounded text-xs font-semibold border border-border bg-secondary hover:bg-muted text-secondary-foreground flex items-center gap-2 transition-colors"
          @click="handleExport"
        >
          <Download class="h-4 w-4" />
          <span>Export Progress JSON</span>
        </button>

        <label
          class="px-4 py-2 rounded text-xs font-semibold border border-border bg-secondary hover:bg-muted text-secondary-foreground flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Upload class="h-4 w-4" />
          <span>Import Progress JSON</span>
          <input type="file" accept=".json" class="hidden" @change="handleImportFile" />
        </label>

        <button
          class="px-4 py-2 rounded text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 ml-auto transition-colors"
          @click="confirmReset"
        >
          <RotateCcw class="h-4 w-4 inline mr-1" />
          Reset All Progress
        </button>
      </div>

      <!-- Export Success Toast / Feedback -->
      <div
        v-if="exportMessage"
        class="p-3 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-mono"
      >
        {{ exportMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, Upload, RotateCcw } from 'lucide-vue-next'

const progress = useProgressStore()
const { totalCount } = useKanji()

const localSettings = ref({ ...progress.settings })
const exportMessage = ref('')

const retentionPercentage = computed(() => {
  if (progress.retentionRate === null) return 'N/A'
  return `${(progress.retentionRate * 100).toFixed(1)}%`
})

const forecastDays = computed(() => progress.dueForecast)
const maxForecastCount = computed(() => {
  const max = Math.max(...forecastDays.value.map((d) => d.count))
  return max === 0 ? 1 : max
})

function saveSettings() {
  progress.updateSettings(localSettings.value)
}

function handleExport() {
  const jsonStr = progress.exportProgress()
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kanji-srs-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)

  exportMessage.value = 'Progress exported successfully!'
  setTimeout(() => {
    exportMessage.value = ''
  }, 3000)
}

function handleImportFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      progress.importProgress(content)
      localSettings.value = { ...progress.settings }
      exportMessage.value = 'Progress imported successfully!'
      setTimeout(() => {
        exportMessage.value = ''
      }, 3000)
    } catch {
      alert('Failed to parse backup JSON file.')
    }
  }
  reader.readAsText(file)
}

function confirmReset() {
  if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
    progress.resetProgress()
    exportMessage.value = 'All progress has been reset.'
    setTimeout(() => {
      exportMessage.value = ''
    }, 3000)
  }
}
</script>
