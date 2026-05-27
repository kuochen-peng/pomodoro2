import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'pomodoro-history'

export const useHistoryStore = defineStore('history', () => {
  // 用 ref 儲存原始資料，讓 computed 能響應更新
  const rawData = ref<Record<string, number>>(loadFromStorage())

  function loadFromStorage(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function todayKey(): string {
    return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
  }

  /** 完成一個番茄時呼叫 */
  function recordPomodoro() {
    const key = todayKey()
    rawData.value = { ...rawData.value, [key]: (rawData.value[key] ?? 0) + 1 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData.value))
  }

  /** 近 7 天歷史（圖表用），rawData 更新時自動重算 */
  const history = computed(() => {
    const result: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`
      result.push({ date: label, count: rawData.value[key] ?? 0 })
    }
    return result
  })

  return { history, recordPomodoro }
})
