/**
 * stores/historyStore.ts — 每日番茄完成數的歷史紀錄
 *
 * 以「日期字串（YYYY-MM-DD）→ 完成數量」的鍵值對形式儲存紀錄，
 * 並提供近 7 天的統計資料供統計頁面的長條圖使用。
 *
 * 資料格式範例（存於 localStorage）：
 *   { "2024-06-01": 5, "2024-06-02": 3, "2024-06-03": 8 }
 *
 * 選擇用日期字串作為 key 而非陣列，是因為：
 *   1. 不同時間跨度查詢更彈性（只取需要的日期）
 *   2. 沒有記錄的日期自然為 0，不需要補洞
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// localStorage 的鍵名
const STORAGE_KEY = 'pomodoro-history'

export const useHistoryStore = defineStore('history', () => {

  /**
   * 從 localStorage 讀取歷史紀錄
   * 用 try-catch 防止 JSON 格式損壞時崩潰
   */
  function loadFromStorage(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  // 用 ref 包裹原始資料物件，才能讓 computed 的 history 響應更新
  // 若直接用 reactive(loadFromStorage()) 並整體替換，computed 無法偵測到
  const rawData = ref<Record<string, number>>(loadFromStorage())

  /**
   * 取得今天的日期字串（YYYY-MM-DD）作為 localStorage 的 key
   * 使用 ISO 字串前 10 個字元，不受時區偏移影響（本地時間 new Date() 已是本地時區）
   */
  function todayKey(): string {
    return new Date().toISOString().slice(0, 10)
  }

  /**
   * 記錄完成一個番茄（由 pomodoroStore.onFinish() 呼叫）
   *
   * 用展開運算子（{ ...rawData.value, [key]: ... }）建立新物件，
   * 而不是直接修改屬性，這樣 ref 的 .value 賦值才能觸發 computed 重新計算
   * （直接修改 rawData.value[key] 也可以，但整體替換語意更清晰）
   */
  function recordPomodoro() {
    const key = todayKey()
    rawData.value = { ...rawData.value, [key]: (rawData.value[key] ?? 0) + 1 }
    // 同步寫入 localStorage，確保資料不因刷新而遺失
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData.value))
  }

  /**
   * 近 7 天的每日番茄統計（圖表用）
   *
   * 每當 rawData 更新時自動重新計算，不需手動刷新。
   * 回傳格式：[{ date: '6/01', count: 5 }, { date: '6/02', count: 3 }, ...]
   * 從 6 天前到今天，共 7 筆，順序由舊到新（符合圖表 X 軸方向）
   * 沒有紀錄的日期 count 為 0，確保圖表的 X 軸每天都有對應的柱子
   */
  const history = computed(() => {
    const result: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)              // 往前推 i 天
      const key = d.toISOString().slice(0, 10) // 'YYYY-MM-DD'（查詢用）
      // 顯示用標籤格式 'M/DD'（如 '6/01'），padStart 確保日期固定兩位數
      const label = `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`
      result.push({ date: label, count: rawData.value[key] ?? 0 })
    }
    return result
  })

  return { history, recordPomodoro }
})
