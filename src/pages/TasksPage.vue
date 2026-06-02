<!--
  pages/TasksPage.vue — 任務清單頁面（薄頁面層）

  只負責將路由與 PomodoroTask 元件連接，不含任何業務邏輯。
  薄頁面設計讓 PomodoroTask 元件可以在未來被嵌入到其他位置，
  而不被路由結構綁死。
-->
<template>
  <!-- 渲染任務清單元件，全部邏輯在 components/PomodoroTask.vue -->
  <PomodoroTasks />
</template>

<script setup lang="ts">
import PomodoroTasks from '@/components/PomodoroTask.vue'
</script>
