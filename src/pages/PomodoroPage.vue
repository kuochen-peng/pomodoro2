<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-8 flex flex-col items-center gap-6">

    <!-- 模式切換 -->
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

    <!-- 圓環計時器 -->
    <div class="relative flex items-center justify-center w-56 h-56">
      <svg class="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-surface-200 dark:stroke-surface-700" stroke-width="4" />
        <circle cx="50" cy="50" r="45" fill="none"
          class="stroke-primary transition-all duration-1000"
          stroke-width="4" stroke-linecap="round"
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
      <Button icon="pi pi-refresh" rounded outlined :disabled="!activeTaskId" @click="activeTaskId && reset()" />
      <Button
        :icon="isRunning ? 'pi pi-pause' : 'pi pi-play'"
        rounded size="large"
        :disabled="!activeTaskId"
        @click="activeTaskId && (isRunning ? stop() : start())"
      />
      <Button icon="pi pi-forward" rounded outlined :disabled="!activeTaskId" @click="activeTaskId && handleFinish()" />
    </div>

    <!-- 選擇任務 -->
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
      <p v-if="activeTask" class="text-xs text-muted-color text-center mt-1">
        🍅 {{ activeTask.completed }} / {{ activeTask.pomodoros }} 已完成
      </p>
    </div>

    <!-- 番茄計數 -->
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
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useTaskStore } from '../stores/taskStore'

const toast = useToast()
const pomodoroStore = usePomodoroStore()
const taskStore = useTaskStore()

const { mode, timeLeft, isRunning, pomodoroCount, activeTaskId, activeTask } = storeToRefs(pomodoroStore)
const { setMode, start, stop, reset, onFinish } = pomodoroStore

const minutes = computed(() => String(Math.floor(timeLeft.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(timeLeft.value % 60).padStart(2, '0'))

const progress = computed(() => {
  const total = pomodoroStore.settings[mode.value]
  return ((total - timeLeft.value) / total) * 283
})

function handleFinish() {
  onFinish((msg) => {
    toast.add({ severity: 'success', summary: msg, life: 4000 })
  })
}

const taskOptions = computed(() =>
  taskStore.tasks.filter(t => !t.done).map(t => ({ label: t.title, value: t.id }))
)
</script>
