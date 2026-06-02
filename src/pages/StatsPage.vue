<!--
  pages/StatsPage.vue — 統計頁面（薄頁面層）

  從 historyStore 取得近 7 天的番茄歷史資料，
  並傳入 StatsChart 元件顯示長條圖與統計摘要。

  資料流：
    historyStore（localStorage）→ StatsPage（取資料）→ StatsChart（純展示）

  StatsChart 被設計為純展示元件（只接受 props），
  不直接依賴 Store，讓它在未來可以接受任意來源的資料。
-->
<template>
  <!-- 將 store 的 history 計算屬性傳入圖表元件 -->
  <StatsChart :history="historyStore.history" />
</template>

<script setup lang="ts">
import StatsChart from '../components/StatsChart.vue'
import { useHistoryStore } from '../stores/historyStore'

// 取得歷史資料 store，直接將 computed history 傳入元件
const historyStore = useHistoryStore()
</script>
