<template>
  <div class="flex flex-col gap-4">

    <!-- 統計卡片 -->
    <div class="grid grid-cols-3 gap-2 sm:gap-4">
      <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-3 sm:p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-primary">{{ total }}</p>
        <p class="text-xs sm:text-sm text-muted-color mt-1">總番茄數</p>
      </div>
      <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-3 sm:p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-primary">{{ best }}</p>
        <p class="text-xs sm:text-sm text-muted-color mt-1">單日最高</p>
      </div>
      <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-3 sm:p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-primary">{{ avg }}</p>
        <p class="text-xs sm:text-sm text-muted-color mt-1">日均番茄</p>
      </div>
    </div>

    <!-- Bar Chart -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-5">
      <h3 class="font-semibold text-color mb-4">近 7 天紀錄</h3>
      <div class="h-56">
        <Chart type="bar" :data="barData" :options="barOptions" class="h-full" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Chart from 'primevue/chart'

const props = defineProps<{
  history: { date: string; count: number }[]
}>()

const barData = computed(() => ({
  labels: props.history.map(h => h.date),
  datasets: [{
    label: '完成番茄數',
    data: props.history.map(h => h.count),
    backgroundColor: '#f97316',
    borderRadius: 6,
  }]
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
}

const total = computed(() => props.history.reduce((s, h) => s + h.count, 0))
const best = computed(() => Math.max(...props.history.map(h => h.count), 0))
const avg = computed(() => props.history.length
  ? (total.value / props.history.length).toFixed(1)
  : '0'
)
</script>
