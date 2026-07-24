<script setup lang="ts">
import { DialogRoot } from 'reka-ui'

withDefaults(
  defineProps<{
    open?: boolean
    defaultOpen?: boolean
    modal?: boolean
  }>(),
  {
    modal: true,
  }
)

const emits = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()
</script>

<template>
  <DialogRoot
    data-slot="dialog"
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="(val) => emits('update:open', val)"
  >
    <slot />
  </DialogRoot>
</template>
