<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useWebNotification } from '@vueuse/core'

const { ensurePermissions } = useWebNotification()
ensurePermissions()
</script>

<style scoped></style>
