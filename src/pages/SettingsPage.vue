<!--
  pages/SettingsPage.vue — 設定頁面（薄頁面層）

  只負責渲染 PomodoroSettings 元件，不含業務邏輯。
  設定頁的所有邏輯（時間調整、鈴聲上傳）都集中在元件層，
  讓路由切換不影響元件的狀態管理。
-->
<template>
  <!-- 渲染設定元件，全部邏輯在 components/PomodoroSettings.vue -->
  <PomodoroSettings />
</template>

<script setup lang="ts">
import PomodoroSettings from '../components/PomodoroSettings.vue'
</script>
