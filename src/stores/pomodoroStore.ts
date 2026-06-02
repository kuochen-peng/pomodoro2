/**
 * stores/pomodoroStore.ts — 番茄計時器的全域狀態
 *
 * 負責管理計時器的核心邏輯：
 *   - 三種模式（番茄 / 短休息 / 長休息）的時間設定
 *   - 倒數計時（每秒 -1）
 *   - 計時完成後的自動切換邏輯（每 4 個番茄換長休息）
 *   - 瀏覽器系統通知（Web Notifications API）
 *   - 與 taskStore、historyStore 的聯動
 *
 * 使用 Pinia defineStore（Setup 函式風格），所有響應式狀態
 * 在 store 外部透過 storeToRefs() 解構後仍保有響應性。
 */

import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { useWebNotification } from '@vueuse/core'  // 封裝 Web Notifications API 的工具函式
import { useTaskStore } from './taskStore'          // 取得任務列表，用來更新任務進度
import { useHistoryStore } from './historyStore'    // 記錄每日完成番茄數
import { playSound } from '../composables/useSound' // 計時結束時播放音效

// 在 store 模組頂層取得通知相關的方法與狀態
// isSupported：瀏覽器是否支援 Notifications API
// permissionGranted：使用者是否已授權通知
const { show, isSupported, permissionGranted } = useWebNotification()

// 計時模式的聯合型別
type Mode = 'pomodoro' | 'short' | 'long'

// 系統通知的圖示 URL（使用番茄圖示）
// 用 new URL(..., import.meta.url) 讓 Vite 將圖片列入打包處理，確保生產環境路徑正確
const ICON = new URL('../assets/pomodoro.png', import.meta.url).href

export const usePomodoroStore = defineStore('pomodoro', () => {

  /**
   * 解析環境變數為秒數
   * 允許透過 .env 的 VITE_*_SECONDS 變數覆寫預設時長，方便開發測試
   * 若環境變數不合法（非正整數），則回退到 fallback 預設值
   */
  const parseEnvSeconds = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  // 三種模式的秒數設定，使用 reactive 讓設定頁面修改後計時器自動更新
  const settings = reactive({
    pomodoro: parseEnvSeconds(import.meta.env.VITE_POMODORO_SECONDS, 25 * 60), // 預設 25 分鐘
    short:    parseEnvSeconds(import.meta.env.VITE_SHORT_BREAK_SECONDS, 5 * 60),  // 預設 5 分鐘
    long:     parseEnvSeconds(import.meta.env.VITE_LONG_BREAK_SECONDS, 15 * 60), // 預設 15 分鐘
  })

  // 目前計時模式
  const mode = ref<Mode>('pomodoro')

  // 剩餘秒數（倒數計時用）
  const timeLeft = ref(settings.pomodoro)

  // 計時器是否正在運作
  const isRunning = ref(false)

  // 本次應用啟動後累計完成的番茄數（刷新後重置）
  const pomodoroCount = ref(0)

  // 目前正在專注的任務 ID，null 表示未選擇任務
  const activeTaskId = ref<number | null>(null)

  // 計算目前選擇的任務物件，供 UI 顯示任務名稱與進度
  // 用 computed 而非直接查詢，確保 taskStore 的任務列表更新後自動同步
  const activeTask = computed(() => {
    const taskStore = useTaskStore()
    return taskStore.tasks.find(t => t.id === activeTaskId.value) ?? null
  })

  /**
   * 發送瀏覽器系統通知
   * 只有在瀏覽器支援且使用者已授權的情況下才發送，避免報錯
   * 若有選擇任務，將任務名稱放在通知的 body 提供更多上下文
   */
  function notify_browser(title: string) {
    if (isSupported.value && permissionGranted.value) {
      const taskTitle = activeTask.value?.title
      show({ title, ...(taskTitle !== undefined && { body: taskTitle }), icon: ICON })
    }
  }

  // setInterval 的回傳值，用來在 clearInterval 時停止計時
  let timer: ReturnType<typeof setInterval> | null = null

  /**
   * 內部停止計時器的函式（私有，前綴 _ 表示不對外暴露）
   * 同時更新 isRunning 狀態與清除 interval
   * 拆出來是因為 setMode / stop / reset 都需要這個行為
   */
  function _stopTimer() {
    isRunning.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  /**
   * 切換計時模式（番茄 / 短休息 / 長休息）
   * 切換前先停止計時，並將剩餘時間重設為新模式的設定秒數
   */
  function setMode(m: Mode) {
    _stopTimer()
    mode.value = m
    timeLeft.value = settings[m]
  }

  /**
   * 開始計時
   * 每 1000ms（1 秒）將 timeLeft -1
   * 當 timeLeft 降到 0 時停止並觸發完成邏輯
   */
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

  /** 暫停計時（保留剩餘時間） */
  function stop() {
    _stopTimer()
  }

  /** 重設計時器：停止並將時間恢復為目前模式的完整設定秒數 */
  function reset() {
    _stopTimer()
    timeLeft.value = settings[mode.value]
  }

  /**
   * 計時完成時的處理邏輯
   *
   * @param notify 可選的 UI 通知回呼（如 Toast），讓呼叫端決定如何顯示訊息，
   *               store 本身只負責狀態，不直接依賴 UI 元件
   *
   * 番茄模式完成：
   *   1. 累計番茄數 +1
   *   2. 在 historyStore 記錄今日完成一個番茄
   *   3. 若有選擇任務，呼叫 taskStore 增加任務的完成番茄數
   *   4. 每完成 4 個番茄自動切換到長休息，否則切換到短休息
   *
   * 休息模式完成：
   *   1. 自動切回番茄模式，提醒使用者繼續專注
   */
  function onFinish(notify?: (msg: string) => void) {
    const taskStore = useTaskStore()
    const historyStore = useHistoryStore()

    // 無論哪種模式完成都播放提示音
    playSound()

    if (mode.value === 'pomodoro') {
      pomodoroCount.value++
      // 將今日番茄數寫入 localStorage 以便統計頁面顯示
      historyStore.recordPomodoro()

      // 若有選擇任務，遞增任務的已完成番茄數（達到目標時自動標為 done）
      if (activeTaskId.value !== null) {
        taskStore.incrementCompleted(activeTaskId.value)
      }

      const msg = `🍅 第 ${pomodoroCount.value} 個番茄完成！`
      notify?.(msg)           // 呼叫 UI Toast（如果傳入的話）
      notify_browser(msg)     // 發送系統通知

      // 每 4 個番茄才能得到長休息，符合標準番茄工作法節奏
      setMode(pomodoroCount.value % 4 === 0 ? 'long' : 'short')
    } else {
      const msg = '⏰ 休息結束，開始下一個番茄！'
      notify?.(msg)
      notify_browser(msg)
      setMode('pomodoro')
    }
  }

  // 對外暴露的狀態與方法
  return {
    settings,       // 三種模式的秒數設定（設定頁面可修改）
    mode,           // 目前模式
    timeLeft,       // 剩餘秒數
    isRunning,      // 是否計時中
    pomodoroCount,  // 本次累計番茄數
    activeTaskId,   // 選中的任務 ID
    activeTask,     // 選中的任務物件（computed）
    setMode,
    start,
    stop,
    reset,
    onFinish,
  }
})
