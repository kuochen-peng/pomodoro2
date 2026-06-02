/**
 * env.d.ts — 環境變數的 TypeScript 型別宣告
 *
 * Vite 會在 import.meta.env 上注入環境變數，但預設型別為 any。
 * 透過擴充 ImportMetaEnv 介面，讓 IDE 對環境變數有自動補全與型別檢查，
 * 避免拼字錯誤造成的執行期錯誤。
 *
 * 對應的環境變數設定在 .env 或 .env.development.local 中，
 * 格式為 VITE_* 前綴（非 VITE_ 的變數不會暴露給前端程式碼）。
 *
 * /// <reference types="vite/client" />
 * 必須放在最上方，引入 Vite 提供的基礎型別（如 import.meta.hot 等），
 * 確保其他 Vite 專屬 API 也有正確的型別。
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 番茄計時的秒數（覆寫預設 25 分鐘 = 1500 秒），主要用於開發測試 */
  readonly VITE_POMODORO_SECONDS: string

  /** 短休息的秒數（覆寫預設 5 分鐘 = 300 秒） */
  readonly VITE_SHORT_BREAK_SECONDS: string

  /** 長休息的秒數（覆寫預設 15 分鐘 = 900 秒） */
  readonly VITE_LONG_BREAK_SECONDS: string
}

// 擴充 ImportMeta 讓 import.meta.env 套用上方的介面型別
interface ImportMeta {
  readonly env: ImportMetaEnv
}
