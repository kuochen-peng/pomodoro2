/**
 * stores/taskStore.ts — 任務清單的全域狀態
 *
 * 管理所有任務的 CRUD 操作，並透過 localStorage 持久化，
 * 讓使用者刷新頁面後任務仍然存在。
 *
 * 持久化策略：
 *   使用 watch 監聽整個 tasks 陣列（序列化為 JSON 字串做比較），
 *   任何任務的新增、刪除、欄位變更都會立即寫入 localStorage。
 *   這比手動在每個方法裡呼叫 setItem 更不易遺漏。
 */

import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Task } from '@/types/task'

// localStorage 的鍵名，統一在頂部定義避免各處硬編碼字串
const STORAGE_KEY = 'pomodoro-tasks'

export const useTaskStore = defineStore('task', () => {

  /**
   * 從 localStorage 讀取任務資料
   * 用 try-catch 包覆，防止 JSON 格式損壞時整個應用崩潰
   * 讀取失敗（包含 localStorage 不可用）時回傳空陣列
   */
  function loadTasks(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  // 使用 reactive 讓陣列的 push/splice/屬性修改都能被 Vue 追蹤到
  // 初始值從 localStorage 載入，實現跨頁面重載的持久化
  const tasks = reactive<Task[]>(loadTasks())

  // 監聽 tasks 的任何變動（透過 JSON 序列化做深度比較）
  // 每當任務有任何改變，就把最新狀態寫入 localStorage
  // 使用 JSON.stringify 作為 getter 函式而非直接監聽 tasks，
  // 是因為 reactive 陣列的直接監聽在某些情況下無法偵測到深層變動
  watch(
    () => JSON.stringify(tasks),
    (val) => localStorage.setItem(STORAGE_KEY, val),
  )

  /**
   * 新增任務
   * 參數省略 id / completed / done，這三個欄位由 store 自動設定：
   *   - id：取現有任務最大 id + 1，確保唯一性（不用 Date.now() 是因為不需要排序性）
   *   - completed：初始為 0（尚未完成任何番茄）
   *   - done：初始為 false
   */
  function addTask(task: Omit<Task, 'id' | 'completed' | 'done'>) {
    const newId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1
    tasks.push({ id: newId, ...task, completed: 0, done: false })
  }

  /**
   * 刪除任務
   * 用 findIndex + splice 找到並移除，splice 能讓 Vue 的響應系統追蹤到變動
   * 若找不到 id 則不做任何事（防禦性處理）
   */
  function deleteTask(id: number) {
    const idx = tasks.findIndex(t => t.id === id)
    if (idx !== -1) tasks.splice(idx, 1)
  }

  /**
   * 切換任務的完成狀態（已完成 ↔ 未完成）
   * 讓使用者可以手動標記/取消標記任務完成，不依賴番茄數是否達標
   */
  function toggleDone(id: number) {
    const task = tasks.find(t => t.id === id)
    if (task) task.done = !task.done
  }

  /**
   * 增加任務的已完成番茄數
   * 由 pomodoroStore.onFinish() 呼叫，每完成一個番茄就呼叫一次
   * 當 completed 達到預計的 pomodoros 數量時，自動將任務標為 done
   * 已完成（done: true）的任務不再累計，避免超出計劃
   */
  function incrementCompleted(id: number) {
    const task = tasks.find(t => t.id === id)
    if (task && !task.done) {
      task.completed++
      // 達到或超過預計番茄數時自動完成任務
      if (task.completed >= task.pomodoros) task.done = true
    }
  }

  return { tasks, addTask, deleteTask, toggleDone, incrementCompleted }
})
