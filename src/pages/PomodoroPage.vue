<!--
  pages/PomodoroPage.vue — 番茄計時器主頁面

  這是應用的核心頁面，整合了計時器 UI 與 Pinia Store，提供：
    - 模式切換（番茄 / 短休息 / 長休息）
    - SVG 圓環進度視覺化
    - 計時控制（開始 / 暫停 / 重設 / 跳過）
    - 任務選擇（將計時與任務進度聯動）
    - 今日番茄數的 emoji 進度顯示

  與 components/PomodoroTimer.vue 的區別：
    此頁面使用 Pinia Store（pomodoroStore / taskStore）管理狀態，
    任務選擇、歷史紀錄等功能完整整合。
    PomodoroTimer.vue 是較早期的獨立版本，狀態僅在元件內部管理。
-->
<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-8 flex flex-col items-center gap-6">

    <!--
      模式切換按鈕群
      使用 v-for 遍歷 settings 物件的 key（pomodoro / short / long），
      讓按鈕清單與設定自動同步，不需手動維護按鈕數量
      isRunning 或非目前模式的按鈕使用 outlined / text 樣式區分，
      目前模式按鈕以 filled 樣式突顯
    -->
    <div class="flex gap-2">
      <Button
        v-for="(_, m) in pomodoroStore.settings" :key="m"
        :label="m === 'pomodoro' ? '番茄' : m === 'short' ? '短休息' : '長休息'"
        :outlined="mode !== m"
        :text="mode !== m"
        size="small" rounded
        @click="setMode(m as any)"
      />
    </div>

    <!--
      SVG 圓環計時器
      用兩個 <circle> 疊加實現進度環效果：
        1. 底層灰色圓環（完整的 360°）
        2. 上層彩色弧線（根據進度調整 stroke-dashoffset）

      關鍵計算：
        - 半徑 r = 45，周長 ≈ 2π×45 ≈ 283（stroke-dasharray）
        - stroke-dashoffset = 283 - progress
          progress 從 0（剛開始）到 283（計時結束）
        - -rotate-90：SVG 預設從 3 點鐘方向開始，旋轉 -90° 讓弧線從 12 點開始
        - transition-all duration-1000：每秒平滑更新弧線，視覺更流暢
    -->
    <div class="relative flex items-center justify-center w-56 h-56">
      <svg class="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <!-- 底層灰色完整圓環（背景軌道） -->
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-surface-200 dark:stroke-surface-700" stroke-width="4" />
        <!-- 上層進度弧線，stroke-dashoffset 動態控制顯示多少弧長 -->
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-primary transition-all duration-1000"
          stroke-width="4" stroke-linecap="round"
          stroke-dasharray="283"
          :stroke-dashoffset="283 - progress"
        />
      </svg>
      <!-- 圓環中央的時間文字 -->
      <div class="flex flex-col items-center">
        <!-- tabular-nums 讓數字固定寬度，避免分秒切換時文字跳動 -->
        <span class="text-5xl font-bold text-color tabular-nums">{{ minutes }}:{{ seconds }}</span>
        <span class="text-sm text-muted-color mt-1">
          {{ mode === 'pomodoro' ? '專注時間' : mode === 'short' ? '短休息' : '長休息' }}
        </span>
      </div>
    </div>

    <!--
      計時控制按鈕
      :disabled="!activeTaskId" 確保未選擇任務時無法操作，
      強制使用者先選任務再計時，避免番茄數無法歸屬到任何任務
    -->
    <div class="flex items-center gap-3">
      <!-- 重設：停止並恢復完整時間 -->
      <Button icon="pi pi-refresh" rounded outlined :disabled="!activeTaskId" @click="activeTaskId && reset()" />
      <!-- 開始 / 暫停切換 -->
      <Button
        :icon="isRunning ? 'pi pi-pause' : 'pi pi-play'"
        rounded size="large"
        :disabled="!activeTaskId"
        @click="activeTaskId && (isRunning ? stop() : start())"
      />
      <!-- 快速完成（跳過）：觸發 onFinish 邏輯，讓計時直接進入下一個階段 -->
      <Button icon="pi pi-forward" rounded outlined :disabled="!activeTaskId" @click="activeTaskId && handleFinish()" />
    </div>

    <!--
      任務選擇下拉選單
      只顯示尚未完成（done: false）的任務，
      已完成任務不應繼續被選擇，避免多計番茄數
      選中任務後 activeTaskId 更新，Store 的 activeTask computed 也隨之更新
    -->
    <div class="w-full flex flex-col gap-1">
      <label class="text-sm text-muted-color text-center">目前任務</label>
      <Select
        v-model="activeTaskId"
        :options="taskOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="選擇要專注的任務"
        emptyMessage="沒有可選的任務"
        class="w-full"
      />
      <!-- 選擇任務後顯示該任務的番茄完成進度 -->
      <p v-if="activeTask" class="text-xs text-muted-color text-center mt-1">
        🍅 {{ activeTask.completed }} / {{ activeTask.pomodoros }} 已完成
      </p>
    </div>

    <!--
      今日番茄計數（最多顯示 8 個）
      超過 pomodoroCount 的位置透明度降低，形成「空番茄槽」的視覺
      8 個的上限是番茄工作法建議的每日最高專注量
    -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-color">今日完成：</span>
      <div class="flex gap-1">
        <span v-for="i in 8" :key="i" class="text-lg"
          :class="i <= pomodoroCount ? 'opacity-100' : 'opacity-20'">🍅</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'    // 從 store 解構 ref 時保持響應性
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useTaskStore } from '../stores/taskStore'

const toast = useToast()
const pomodoroStore = usePomodoroStore()
const taskStore = useTaskStore()

// storeToRefs 解構後的 ref 仍與 store 保持雙向綁定
// 直接解構（const { mode } = pomodoroStore）會失去響應性
const { mode, timeLeft, isRunning, pomodoroCount, activeTaskId, activeTask } = storeToRefs(pomodoroStore)
// 方法不是 ref，直接解構即可
const { setMode, start, stop, reset, onFinish } = pomodoroStore

// 將剩餘秒數拆分為分鐘與秒數，並補零確保固定兩位數（如 09:05）
const minutes = computed(() => String(Math.floor(timeLeft.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(timeLeft.value % 60).padStart(2, '0'))

/**
 * 圓環進度值（0–283）
 * progress = 0 時圓環全空（計時剛開始）
 * progress = 283 時圓環全滿（計時結束）
 * 公式：(已過時間 / 總時間) × 圓周長
 */
const progress = computed(() => {
  const total = pomodoroStore.settings[mode.value]
  return ((total - timeLeft.value) / total) * 283
})

/**
 * 跳過 / 手動完成的處理函式
 * 包裝 store 的 onFinish，並注入 Toast 通知回呼
 * 這樣 store 不需要直接依賴 PrimeVue Toast，保持 store 的 UI 無關性
 */
function handleFinish() {
  onFinish((msg) => {
    toast.add({ severity: 'success', summary: msg, life: 4000 })
  })
}

// 任務選單選項：只顯示未完成的任務，格式化為 Select 元件需要的 { label, value }
const taskOptions = computed(() =>
  taskStore.tasks.filter(t => !t.done).map(t => ({ label: t.title, value: t.id }))
)
</script>
