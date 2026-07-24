<template>
  <div class="min-h-screen bg-background text-foreground selection:bg-primary/20">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const { applyTheme } = useTheme()

onMounted(() => {
  applyTheme()
})
</script>
