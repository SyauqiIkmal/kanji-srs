<script setup lang="ts">
import { DialogRoot, useForwardPropsEmits } from "reka-ui"

const props = defineProps<{
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
}>()
const emits = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot
    v-slot="slotProps"
    data-slot="dialog"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>
