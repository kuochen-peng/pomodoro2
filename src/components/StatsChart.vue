<!--
  components/StatsChart.vue — 統計圖表元件

  純展示（Presentational）元件：只接受 props，不直接依賴任何 Store，
  這樣設計的好處是可測試性高，也容易在未來接入不同來源的資料。

  顯示內容：
    1. 三個摘要統計卡片（7 天總計、單日最高、日均）
    2. 近 7 天的每日番茄數長條圖（由 PrimeVue Chart / Chart.js 渲染）
-->
<template>
  <div class="flex flex-col gap-4">

    <!-- 統計摘要卡片（三欄網格） -->
    <div class="grid grid-cols-3 gap-2 sm:gap-4">

      <!-- 7 天總番茄數 -->
      <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-3 sm:p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-primary">{{ total }}</p>
        <p class="text-xs sm:text-sm text-muted-color mt-1">總番茄數</p>
      </div>

      <!-- 7 天內單日最高記錄 -->
      <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-3 sm:p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-primary">{{ best }}</p>
        <p class="text-xs sm:text-sm text-muted-color mt-1">單日最高</p>
      </div>

      <!-- 7 天的日平均，保留一位小數讓結果更精確 -->
      <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-3 sm:p-4 text-center">
        <p class="text-2xl sm:text-3xl font-bold text-primary">{{ avg }}</p>
        <p class="text-xs sm:text-sm text-muted-color mt-1">日均番茄</p>
      </div>
    </div>

    <!-- 近 7 天長條圖 -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-5">
      <h3 class="font-semibold text-color mb-4">近 7 天紀錄</h3>
      <!-- h-56 固定高度，配合 maintainAspectRatio: false 讓圖表填滿容器 -->
      <div class="h-56">
        <Chart type="bar" :data="barData" :options="barOptions" class="h-full" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Chart from 'primevue/chart'  // PrimeVue 封裝的 Chart.js 元件

// 接收父元件傳入的 7 天歷史資料（由 StatsPage 從 historyStore 取得）
const props = defineProps<{
  history: { date: string; count: number }[]
}>()

/**
 * 長條圖的資料格式（Chart.js 需要的結構）
 * labels：X 軸日期標籤（如 '6/01'）
 * datasets[0].data：Y 軸每日番茄數
 * backgroundColor：橘色（與番茄顏色呼應）
 * borderRadius：柱子頂端圓角，現代感視覺
 */
const barData = computed(() => ({
  labels: props.history.map(h => h.date),
  datasets: [{
    label: '完成番茄數',
    data: props.history.map(h => h.count),
    backgroundColor: '#f97316', // Tailwind orange-500
    borderRadius: 6,
  }]
}))

/**
 * Chart.js 圖表選項
 * responsive: true — 隨容器寬度自動調整
 * maintainAspectRatio: false — 讓圖表高度由容器 CSS 決定（配合 h-56）
 * legend: display: false — 只有一個資料集，圖例不必要，省空間
 * beginAtZero — Y 軸從 0 開始，才能正確反映絕對數量大小
 * stepSize: 1 — Y 軸刻度以 1 為間隔（番茄數為整數，不需小數刻度）
 */
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
}

// 7 天總計：加總所有日期的番茄數
const total = computed(() => props.history.reduce((s, h) => s + h.count, 0))

// 單日最高：取最大值，第二個參數 0 確保沒有資料時回傳 0 而非 -Infinity
const best = computed(() => Math.max(...props.history.map(h => h.count), 0))

// 日均：總計 ÷ 天數，toFixed(1) 保留一位小數；沒有資料時回傳 '0'
const avg = computed(() => props.history.length
  ? (total.value / props.history.length).toFixed(1)
  : '0'
)
</script>
