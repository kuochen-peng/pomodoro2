<!--
  components/PomodoroTimer.vue — 獨立版番茄計時器元件（舊版）

  注意：這是較早期的獨立計時器元件，狀態完全在元件內部管理（不使用 Pinia Store）。
  目前應用的首頁計時器是 pages/PomodoroPage.vue，整合了 pomodoroStore、taskStore
  與 historyStore，提供任務選擇、歷史紀錄等完整功能。

  此元件保留的原因：
    - 作為不依賴 Store 的輕量版，可嵌入任何不需要 Store 整合的情境
    - 結構簡單，適合作為計時器邏輯的參考實作

  功能：
    - 三種模式切換（番茄 25min / 短休息 5min / 長休息 15min）
    - SVG 圓環進度視覺化
    - 開始 / 暫停 / 重設 / 快速完成
    - 計時結束後播放音效 + Toast 通知
    - 元件卸載時自動清除計時器，避免記憶體洩漏
-->
<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-8 flex flex-col items-center gap-6">

    <!--
      模式切換按鈕群
      v-for 遍歷 settings 物件的 key（pomodoro / short / long）
      目前模式的按鈕用 filled 樣式，其他用 outlined / text 區分
    -->
    <div class="flex gap-2">
      <Button
        v-for="(_, m) in settings" :key="m"
        :label="m === 'pomodoro' ? '番茄' : m === 'short' ? '短休息' : '長休息'"
        :outlined="mode !== m"
        :text="mode !== m"
        size="small"
        rounded
        @click="setMode(m as Mode)"
      />
    </div>

    <!--
      SVG 圓環計時器（與 PomodoroPage 邏輯相同）
      兩個同心圓：底層灰色軌道 + 上層彩色進度弧線
      stroke-dashoffset 動態控制弧線顯示長度，-rotate-90 讓起點在 12 點方向
    -->
    <div class="relative flex items-center justify-center w-56 h-56">
      <svg class="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <!-- 底層灰色完整圓環（背景軌道） -->
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-surface-200 dark:stroke-surface-700" stroke-width="4" />
        <!-- 進度弧線：stroke-dashoffset 越小代表弧線越長（進度越多） -->
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-primary transition-all duration-1000"
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="283"
          :stroke-dashoffset="283 - progress"
        />
      </svg>
      <!-- 圓環中央：時間數字 + 模式說明文字 -->
      <div class="flex flex-col items-center">
        <span class="text-5xl font-bold text-color tabular-nums">{{ minutes }}:{{ seconds }}</span>
        <span class="text-sm text-muted-color mt-1">
          {{ mode === 'pomodoro' ? '專注時間' : mode === 'short' ? '短休息' : '長休息' }}
        </span>
      </div>
    </div>

    <!--
      計時控制按鈕（此版本無任務限制，任何時候都可操作）
    -->
    <div class="flex items-center gap-3">
      <!-- 重設 -->
      <Button icon="pi pi-refresh" rounded outlined @click="reset" />
      <!-- 開始 / 暫停切換 -->
      <Button
        :icon="isRunning ? 'pi pi-pause' : 'pi pi-play'"
        rounded size="large"
        @click="isRunning ? stop() : start()"
      />
      <!-- 跳過（立即觸發完成邏輯） -->
      <Button icon="pi pi-forward" rounded outlined @click="onFinish" />
    </div>

    <!--
      今日番茄計數（最多顯示 8 個）
      此版本的計數僅在元件存活期間有效，頁面刷新後重置
    -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-color">今日完成：</span>
      <div class="flex gap-1">
        <span
          v-for="i in 8" :key="i"
          class="text-lg"
          :class="i <= pomodoroCount ? 'opacity-100' : 'opacity-20'"
        >🍅</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { playSound } from '../composables/useSound'

const toast = useToast()

// 計時模式的型別（與 pomodoroStore 一致）
type Mode = 'pomodoro' | 'short' | 'long'

// 各模式的固定秒數設定（此版本不支援動態修改）
const settings = {
  pomodoro: 25 * 60,  // 25 分鐘
  short: 5 * 60,       // 5 分鐘
  long: 15 * 60,       // 15 分鐘
}

// 目前計時模式
const mode = ref<Mode>('pomodoro')
// 剩餘秒數
const timeLeft = ref(settings.pomodoro)
// 計時器是否正在運作
const isRunning = ref(false)
// 本次累計的番茄數（元件卸載後重置）
const pomodoroCount = ref(0)

// setInterval 的回傳值，元件卸載時需要用來清除
let timer: ReturnType<typeof setInterval> | null = null

// 將剩餘秒數格式化為 MM:SS
const minutes = computed(() => String(Math.floor(timeLeft.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(timeLeft.value % 60).padStart(2, '0'))

/**
 * 圓環進度值（0–283，對應 SVG 的圓周長）
 * 從 0（剛開始）增加到 283（計時結束），讓圓環從空到滿
 */
const progress = computed(() => {
  const total = settings[mode.value]
  return ((total - timeLeft.value) / total) * 283
})

/** 切換模式：停止目前計時並重設為新模式的時間 */
function setMode(m: Mode) {
  stop()
  mode.value = m
  timeLeft.value = settings[m]
}

/** 開始計時：每秒倒數一秒，到 0 時觸發完成邏輯 */
function start() {
  isRunning.value = true
  timer = setInterval(() => {
    if (timeLeft.value <= 0) {
      stop()
      onFinish()
      return
    }
    timeLeft.value--
  }, 1000)
}

/** 暫停計時（保留剩餘時間） */
function stop() {
  isRunning.value = false
  if (timer) clearInterval(timer)
}

/** 重設：停止並恢復目前模式的完整時間 */
function reset() {
  stop()
  timeLeft.value = settings[mode.value]
}

/**
 * 計時完成的處理邏輯
 * 播放音效、顯示 Toast、遞增番茄數，並按照番茄工作法自動切換下一個模式
 * 每 4 個番茄後進入長休息，否則進入短休息
 */
function onFinish() {
  playSound()
  if (mode.value === 'pomodoro') {
    pomodoroCount.value++
    toast.add({
      severity: 'success',
      summary: '🍅 番茄完成！',
      detail: `已完成第 ${pomodoroCount.value} 個番茄，休息一下吧！`,
      life: 5000,
    })
    setMode(pomodoroCount.value % 4 === 0 ? 'long' : 'short')
  } else {
    toast.add({
      severity: 'info',
      summary: '⏰ 休息結束',
      detail: '準備好了嗎？開始下一個番茄！',
      life: 5000,
    })
    setMode('pomodoro')
  }
}

// 元件卸載時清除 interval，防止元件已消失但計時器仍在背景執行造成記憶體洩漏
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
