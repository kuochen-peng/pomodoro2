<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-8 flex flex-col items-center gap-6">

    <!-- 模式切換 -->
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

    <!-- 圓環計時器 -->
    <div class="relative flex items-center justify-center w-56 h-56">
      <svg class="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-surface-200 dark:stroke-surface-700" stroke-width="4" />
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-primary transition-all duration-1000"
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="283"
          :stroke-dashoffset="283 - progress"
        />
      </svg>
      <div class="flex flex-col items-center">
        <span class="text-5xl font-bold text-color tabular-nums">{{ minutes }}:{{ seconds }}</span>
        <span class="text-sm text-muted-color mt-1">
          {{ mode === 'pomodoro' ? '專注時間' : mode === 'short' ? '短休息' : '長休息' }}
        </span>
      </div>
    </div>

    <!-- 控制按鈕 -->
    <div class="flex items-center gap-3">
      <Button icon="pi pi-refresh" rounded outlined @click="reset" />
      <Button
        :icon="isRunning ? 'pi pi-pause' : 'pi pi-play'"
        rounded size="large"
        @click="isRunning ? stop() : start()"
      />
      <Button icon="pi pi-forward" rounded outlined @click="onFinish" />
    </div>

    <!-- 番茄計數 -->
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

type Mode = 'pomodoro' | 'short' | 'long'

const settings = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

const mode = ref<Mode>('pomodoro')
const timeLeft = ref(settings.pomodoro)
const isRunning = ref(false)
const pomodoroCount = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

const minutes = computed(() => String(Math.floor(timeLeft.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(timeLeft.value % 60).padStart(2, '0'))

const progress = computed(() => {
  const total = settings[mode.value]
  return ((total - timeLeft.value) / total) * 283
})

function setMode(m: Mode) {
  stop()
  mode.value = m
  timeLeft.value = settings[m]
}

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

function stop() {
  isRunning.value = false
  if (timer) clearInterval(timer)
}

function reset() {
  stop()
  timeLeft.value = settings[mode.value]
}

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

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
