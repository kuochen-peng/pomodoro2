<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
    <Toast position="bottom-center" />

    <header class="bg-surface-0 dark:bg-surface-800 border-b border-surface px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">

      <!-- Logo -->
      <div class="flex items-center gap-2">
        <i class="pi pi-stopwatch text-primary text-2xl"></i>
        <span class="text-xl font-bold text-color">Pomodoro</span>
      </div>

      <!-- Nav：手機只顯示 icon，桌機顯示 icon + label -->
      <nav class="flex justify-center gap-1">
        <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to" custom v-slot="{ isActive, navigate }">
          <Button :icon="link.icon" text size="small"
            v-bind="isSm ? { label: link.label } : {}"
            :class="isActive ? 'text-primary!' : ''" @click="navigate" />
        </RouterLink>
      </nav>

      <!-- 深色切換 -->
      <Button :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" rounded text @click="toggleDark" />
    </header>

    <main class="max-w-5xl mx-auto p-4 sm:p-6">
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

const breakpoints = useBreakpoints(breakpointsTailwind)
const isSm = breakpoints.greaterOrEqual('sm')

const navLinks = [
  { to: '/',         icon: 'pi pi-clock',     label: '計時器' },
  { to: '/tasks',    icon: 'pi pi-list',       label: '任務'   },
  { to: '/stats',    icon: 'pi pi-chart-bar',  label: '統計'   },
  { to: '/settings', icon: 'pi pi-cog',        label: '設定'   },
]

const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('my-app-dark', isDark.value)
}
</script>
