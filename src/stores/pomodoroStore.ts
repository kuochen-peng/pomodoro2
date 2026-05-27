import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { useWebNotification } from '@vueuse/core'
import { useTaskStore } from './taskStore'
import { useHistoryStore } from './historyStore'
import { playSound } from '../composables/useSound'

const { show, isSupported, permissionGranted } = useWebNotification()

type Mode = 'pomodoro' | 'short' | 'long'

const ICON = new URL('../assets/pomodoro.png', import.meta.url).href

export const usePomodoroStore = defineStore('pomodoro', () => {
  const parseEnvSeconds = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  const settings = reactive({
    pomodoro: parseEnvSeconds(import.meta.env.VITE_POMODORO_SECONDS, 25 * 60),
    short:    parseEnvSeconds(import.meta.env.VITE_SHORT_BREAK_SECONDS, 5 * 60),
    long:     parseEnvSeconds(import.meta.env.VITE_LONG_BREAK_SECONDS, 15 * 60),
  })

  const mode = ref<Mode>('pomodoro')
  const timeLeft = ref(settings.pomodoro)
  const isRunning = ref(false)
  const pomodoroCount = ref(0)
  const activeTaskId = ref<number | null>(null)

  const activeTask = computed(() => {
    const taskStore = useTaskStore()
    return taskStore.tasks.find(t => t.id === activeTaskId.value) ?? null
  })

  function notify_browser(title: string) {
    if (isSupported.value && permissionGranted.value) {
      const taskTitle = activeTask.value?.title
      show({ title, ...(taskTitle !== undefined && { body: taskTitle }), icon: ICON })
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null

  function _stopTimer() {
    isRunning.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function setMode(m: Mode) {
    _stopTimer()
    mode.value = m
    timeLeft.value = settings[m]
  }

  function start() {
    isRunning.value = true
    timer = setInterval(() => {
      if (timeLeft.value <= 0) {
        _stopTimer()
        onFinish()
        return
      }
      timeLeft.value--
    }, 1000)
  }

  function stop() {
    _stopTimer()
  }

  function reset() {
    _stopTimer()
    timeLeft.value = settings[mode.value]
  }

  function onFinish(notify?: (msg: string) => void) {
    const taskStore = useTaskStore()
    const historyStore = useHistoryStore()

    playSound()

    if (mode.value === 'pomodoro') {
      pomodoroCount.value++
      historyStore.recordPomodoro()

      if (activeTaskId.value !== null) {
        taskStore.incrementCompleted(activeTaskId.value)
      }

      const msg = `🍅 第 ${pomodoroCount.value} 個番茄完成！`
      notify?.(msg)
      notify_browser(msg)
      setMode(pomodoroCount.value % 4 === 0 ? 'long' : 'short')
    } else {
      const msg = '⏰ 休息結束，開始下一個番茄！'
      notify?.(msg)
      notify_browser(msg)
      setMode('pomodoro')
    }
  }

  return {
    settings,
    mode,
    timeLeft,
    isRunning,
    pomodoroCount,
    activeTaskId,
    activeTask,
    setMode,
    start,
    stop,
    reset,
    onFinish,
  }
})
