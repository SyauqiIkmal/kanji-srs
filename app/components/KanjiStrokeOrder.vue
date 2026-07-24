<template>
  <div class="flex flex-col items-center space-y-3">
    <!-- SVG Container Card -->
    <div
      class="relative flex items-center justify-center p-3 rounded-lg border border-border bg-card shadow-sm w-48 h-48 sm:w-56 sm:h-56"
    >
      <!-- 4x4 Rice Paper Guideline Grid -->
      <svg
        class="absolute inset-0 w-full h-full text-border/40 pointer-events-none p-3"
        viewBox="0 0 109 109"
      >
        <line
          x1="0"
          y1="54.5"
          x2="109"
          y2="54.5"
          stroke="currentColor"
          stroke-dasharray="3,3"
          stroke-width="1"
        />
        <line
          x1="54.5"
          y1="0"
          x2="54.5"
          y2="109"
          stroke="currentColor"
          stroke-dasharray="3,3"
          stroke-width="1"
        />
        <rect
          x="0"
          y="0"
          width="109"
          height="109"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
          opacity="0.3"
        />
      </svg>

      <!-- Kanji SVG Strokes Display -->
      <svg
        v-if="strokeInfo"
        :viewBox="strokeInfo.viewBox"
        class="w-full h-full relative z-10 select-none overflow-visible"
      >
        <!-- Background static ghost paths (light gray) -->
        <g
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-muted/30"
          stroke-width="4"
        >
          <path v-for="(path, idx) in strokeInfo.paths" :key="`ghost-${idx}`" :d="path" />
        </g>

        <!-- Drawn completed strokes (Sumi Ink / foreground) -->
        <g
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-foreground"
          stroke-width="4"
        >
          <path
            v-for="(path, idx) in strokeInfo.paths"
            :key="`drawn-${idx}`"
            :d="path"
            :class="{ hidden: idx > currentStep }"
          />
        </g>

        <!-- Current active stroke (Animated Vermillion Accent) -->
        <g
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-primary"
          stroke-width="5"
        >
          <path
            v-if="currentStep >= 0 && currentStep < strokeInfo.paths.length"
            :key="`active-${currentStep}`"
            :d="strokeInfo.paths[currentStep]"
            class="animate-draw"
          />
        </g>

        <!-- Stroke Order Numbers -->
        <g v-if="showNumbers" class="text-[9px] font-mono fill-muted-foreground select-none">
          <text
            v-for="(pos, idx) in strokeStartPositions"
            :key="`num-${idx}`"
            :x="pos.x"
            :y="pos.y"
            :class="[idx <= currentStep ? 'fill-primary font-bold' : 'fill-muted-foreground/60']"
          >
            {{ idx + 1 }}
          </text>
        </g>
      </svg>

      <!-- Loading / Empty State -->
      <div v-else class="text-xs text-muted-foreground animate-pulse">Loading stroke data...</div>
    </div>

    <!-- Animation Controls -->
    <div
      v-if="strokeInfo"
      class="flex items-center gap-1.5 p-1 rounded-md border border-border bg-secondary/60"
    >
      <!-- Step Prev -->
      <button
        title="Previous Stroke"
        class="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30"
        :disabled="currentStep <= 0"
        @click="stepPrev"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <!-- Play / Pause Toggle -->
      <button
        :title="isPlaying ? 'Pause' : 'Play Animation'"
        class="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90"
        @click="togglePlay"
      >
        <Pause v-if="isPlaying" class="h-4 w-4" />
        <Play v-else class="h-4 w-4 fill-current" />
      </button>

      <!-- Step Next -->
      <button
        title="Next Stroke"
        class="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-30"
        :disabled="currentStep >= strokeInfo.paths.length - 1"
        @click="stepNext"
      >
        <ChevronRight class="h-4 w-4" />
      </button>

      <!-- Replay -->
      <button
        title="Replay from stroke 1"
        class="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-foreground"
        @click="restart"
      >
        <RotateCcw class="h-4 w-4" />
      </button>

      <!-- Speed Toggle -->
      <button
        title="Animation Speed"
        class="px-2 py-1 rounded hover:bg-card text-[11px] font-mono text-muted-foreground hover:text-foreground font-semibold"
        @click="cycleSpeed"
      >
        {{ speed }}x
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    char: string
    showNumbers?: boolean
    autoPlay?: boolean
  }>(),
  {
    showNumbers: true,
    autoPlay: true,
  },
)

const { getStroke, isLoaded, loadStrokes } = useStrokes()

const currentStep = ref(0)
const isPlaying = ref(false)
const speed = ref(1)
let timer: ReturnType<typeof setInterval> | null = null

const strokeInfo = computed(() => getStroke(props.char))

// Estimate starting coordinates for stroke numbers
const strokeStartPositions = computed(() => {
  if (!strokeInfo.value) return []
  return strokeInfo.value.paths.map((d) => {
    // Extract first 'M x y' or 'm x y' command coordinates
    const match = d.match(/[Mm]\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/)
    if (match && match[1] && match[2]) {
      return {
        x: Math.max(4, Math.min(100, parseFloat(match[1]) - 4)),
        y: Math.max(10, Math.min(100, parseFloat(match[2]) - 4)),
      }
    }
    return { x: 10, y: 10 }
  })
})

function startTimer() {
  stopTimer()
  if (!strokeInfo.value) return

  isPlaying.value = true
  const intervalMs = Math.round(700 / speed.value)

  timer = setInterval(() => {
    if (!strokeInfo.value) return
    if (currentStep.value < strokeInfo.value.paths.length - 1) {
      currentStep.value++
    } else {
      stopTimer()
    }
  }, intervalMs)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isPlaying.value = false
}

function togglePlay() {
  if (isPlaying.value) {
    stopTimer()
  } else {
    if (strokeInfo.value && currentStep.value >= strokeInfo.value.paths.length - 1) {
      currentStep.value = 0
    }
    startTimer()
  }
}

function restart() {
  stopTimer()
  currentStep.value = 0
  startTimer()
}

function stepPrev() {
  stopTimer()
  if (currentStep.value > 0) currentStep.value--
}

function stepNext() {
  stopTimer()
  if (strokeInfo.value && currentStep.value < strokeInfo.value.paths.length - 1) {
    currentStep.value++
  }
}

function cycleSpeed() {
  if (speed.value === 1) speed.value = 1.5
  else if (speed.value === 1.5) speed.value = 2
  else if (speed.value === 2) speed.value = 0.5
  else speed.value = 1

  if (isPlaying.value) {
    startTimer()
  }
}

watch(
  () => props.char,
  () => {
    currentStep.value = 0
    if (props.autoPlay) {
      startTimer()
    }
  },
)

onMounted(async () => {
  if (!isLoaded.value) {
    await loadStrokes()
  }
  if (props.autoPlay) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
@keyframes drawStroke {
  from {
    stroke-dashoffset: 200;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.animate-draw {
  stroke-dasharray: 200;
  animation: drawStroke 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
</style>
