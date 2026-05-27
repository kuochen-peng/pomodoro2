<template>
  <StatsChart :history="historyStore.history" />
</template>

<script setup lang="ts">
import StatsChart from '../components/StatsChart.vue'
import { useHistoryStore } from '../stores/historyStore'

const historyStore = useHistoryStore()
</script>
