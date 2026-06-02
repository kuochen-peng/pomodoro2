<!--
  layouts/DefaultLayout.vue — 主版型佈局

  提供所有頁面共用的外框結構：
    - 頂部導覽列（Logo + 頁面連結 + 深色模式切換）
    - 主內容區（<RouterView> 由此插入各頁面元件）
    - 全域 Toast 通知容器（放在版型層，讓所有子頁面都能使用）

  響應式導覽列設計：
    - 手機（< sm）：只顯示圖示（icon），節省空間
    - 桌機（≥ sm）：顯示圖示 + 文字標籤，更清楚
    使用 VueUse 的 useBreakpoints 偵測螢幕寬度，再動態綁定 Button 的 label 屬性
-->
<template>
  <!-- 整頁容器：設定背景色並加入深色模式的顏色轉換動畫 -->
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300">

    <!--
      全域 Toast 通知，放在此處而非 App.vue，
      是因為 ToastService 需要在 PrimeVue 掛載後才能運作，
      而此版型保證在 PrimeVue 完成初始化後才渲染
    -->
    <Toast position="bottom-center" />

    <!-- 頂部導覽列：三欄格線（Logo | 導覽連結 | 深色切換） -->
    <header class="bg-surface-0 dark:bg-surface-800 border-b border-surface px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">

      <!-- Logo 區域 -->
      <div class="flex items-center gap-2">
        <i class="pi pi-stopwatch text-primary text-2xl"></i>
        <span class="text-xl font-bold text-color">Pomodoro</span>
      </div>

      <!--
        頁面導覽連結
        使用 RouterLink 的 custom v-slot 模式，讓 PrimeVue Button 作為連結的渲染元素，
        同時保有路由的 isActive 狀態來決定按鈕是否要套用高亮樣式
        isSm 為 true（桌機）時才綁定 label 屬性顯示文字標籤
      -->
      <nav class="flex justify-center gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          custom
          v-slot="{ isActive, navigate }"
        >
          <Button
            :icon="link.icon"
            text
            size="small"
            v-bind="isSm ? { label: link.label } : {}"
            :class="isActive ? 'text-primary!' : ''"
            @click="navigate"
          />
        </RouterLink>
      </nav>

      <!--
        深色模式切換按鈕
        切換時在 <html> 標籤加/移除 '.my-app-dark' class，
        此 class 與 main.ts 的 PrimeVue darkModeSelector 設定對應，
        讓 PrimeVue 元件與 Tailwind dark: 樣式同時切換
      -->
      <Button
        :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
        rounded
        text
        @click="toggleDark"
      />
    </header>

    <!-- 主內容區：限制最大寬度並居中，讓寬螢幕不會過寬影響可讀性 -->
    <main class="max-w-5xl mx-auto p-4 sm:p-6">
      <!-- 路由對應的頁面元件由此插入 -->
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

// 使用 Tailwind 斷點設定偵測螢幕寬度
// breakpointsTailwind 包含 sm(640px) / md(768px) 等標準斷點
const breakpoints = useBreakpoints(breakpointsTailwind)
// greaterOrEqual('sm')：當螢幕寬度 >= 640px 時為 true，用來切換導覽列顯示模式
const isSm = breakpoints.greaterOrEqual('sm')

// 導覽連結設定：統一管理路徑、圖示和標籤，方便新增或修改頁面
const navLinks = [
  { to: '/',         icon: 'pi pi-clock',     label: '計時器' },
  { to: '/tasks',    icon: 'pi pi-list',       label: '任務'   },
  { to: '/stats',    icon: 'pi pi-chart-bar',  label: '統計'   },
  { to: '/settings', icon: 'pi pi-cog',        label: '設定'   },
]

// 深色模式狀態，false = 淺色
const isDark = ref(false)

/**
 * 切換深色模式
 * 直接操作 document.documentElement（即 <html>）的 class，
 * 讓 CSS 的 .my-app-dark 選擇器與 Tailwind 的 dark: 變體都能正確觸發
 */
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('my-app-dark', isDark.value)
}
</script>
