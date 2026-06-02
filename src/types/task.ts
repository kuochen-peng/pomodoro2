/**
 * types/task.ts — 任務的資料型別定義
 *
 * 集中定義 Task 介面，讓 taskStore、PomodoroTask 元件等地方
 * 共用同一份型別描述，避免各自散落定義造成不一致。
 */

export interface Task {
  /** 唯一識別碼，由 taskStore.addTask 自動遞增產生 */
  id: number

  /** 任務名稱（使用者輸入的文字說明） */
  title: string

  /** 優先度：high（高）/ medium（中）/ low（低）
   *  用來在任務清單中顯示不同顏色的 Tag */
  priority: 'high' | 'medium' | 'low'

  /** 預計完成此任務需要的番茄數（使用者設定，1–8） */
  pomodoros: number

  /** 已經完成的番茄數（每次計時到時自動 +1） */
  completed: number

  /** 是否已標記為完成
   *  當 completed >= pomodoros 時自動設為 true，
   *  或使用者手動點擊切換 */
  done: boolean
}
