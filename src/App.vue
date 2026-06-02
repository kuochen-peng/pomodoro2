<!--
  App.vue — 根元件

  整個應用的最頂層元件，只做兩件事：
  1. 渲染 <RouterView>，讓 Vue Router 根據目前 URL 決定要顯示哪個頁面佈局
  2. 在應用啟動時請求瀏覽器通知權限，讓番茄計時完成時能推送系統通知
-->
<template>
  <!-- RouterView 會在此位置插入對應路由的元件（如 DefaultLayout） -->
  <RouterView />
</template>

<script setup lang="ts">
import { useWebNotification } from '@vueuse/core'
// useWebNotification 封裝了 Notification API，提供跨瀏覽器的通知功能

const { ensurePermissions } = useWebNotification()

// 應用一載入就詢問使用者是否允許通知
// 放在根元件而非計時器元件，是為了讓瀏覽器的權限彈窗在進入頁面時就出現，
// 避免在計時結束的關鍵時刻才彈出干擾使用者
ensurePermissions()
</script>

<style scoped></style>
