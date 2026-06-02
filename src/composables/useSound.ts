/**
 * composables/useSound.ts — 音效管理
 *
 * 提供計時結束時的提示音功能，支援兩種音效來源：
 *   1. 使用者自訂音效：從 localStorage 讀取的 base64 data URL（透過 FileReader 轉換）
 *   2. 預設嗶聲：用 Web Audio API 即時合成，不需要任何外部音效檔案
 *
 * 選擇 Web Audio API 作為預設音效的原因：
 *   - 不需打包或載入額外的音效資源，減少初始下載大小
 *   - 可精確控制音調、音量與淡出，產生乾淨的提示音
 *   - 在不支援自訂音效的環境也能正常發聲
 *
 * 選擇 base64 data URL 儲存自訂音效的原因：
 *   - 音效完整存在 localStorage，不依賴外部伺服器或 Service Worker Cache
 *   - 使用者清除快取也不會失去自訂音效（localStorage 不受清除快取影響）
 *   - 缺點：較大的音效檔會佔用較多 localStorage 空間（上限約 5–10 MB）
 */

// localStorage 存放自訂音效的鍵名
const STORAGE_KEY = 'pomodoro-custom-sound'

/**
 * 從 localStorage 讀取自訂音效的 base64 data URL
 * 沒有自訂音效時回傳 null，呼叫端以此判斷要播哪種音效
 */
function loadCustomSound(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * 將使用者選擇的音效檔案轉換為 base64 data URL 並儲存到 localStorage
 *
 * 使用 FileReader.readAsDataURL() 將二進位檔案轉為可直接用於 new Audio() 的字串，
 * 這樣就不需要 Blob URL（Blob URL 在頁面關閉後失效）
 * 回傳 Promise 讓呼叫端可以 await 並在儲存完成後更新 UI
 */
export function saveCustomSound(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    // 非同步讀取完成後，將結果（base64 字串）寫入 localStorage
    reader.onload = () => {
      localStorage.setItem(STORAGE_KEY, reader.result as string)
      resolve()
    }
    // 讀取失敗（如檔案損壞）時 reject，讓呼叫端可以處理錯誤
    reader.onerror = reject
    reader.readAsDataURL(file) // 觸發非同步讀取
  })
}

/**
 * 清除自訂音效，下次播放將改用預設嗶聲
 */
export function clearCustomSound() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 用 Web Audio API 產生一聲短促的提示嗶聲
 *
 * 音訊圖：Oscillator → GainNode → AudioContext.destination（喇叭）
 * 使用 sine 波形（最柔和），頻率 880 Hz（A5，清脆但不刺耳）
 * 透過 exponentialRampToValueAtTime 讓音量平滑衰減，避免突然截斷的爆音
 */
function playBeep() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator() // 產生週期性聲波的音源節點
  const gain = ctx.createGain()      // 控制音量的節點

  // 連接音訊處理鏈
  osc.connect(gain)
  gain.connect(ctx.destination) // destination = 裝置的實際喇叭輸出

  osc.type = 'sine'             // 正弦波，音色最圓潤
  osc.frequency.value = 880     // 880 Hz = A5，清晰易聽

  // 初始音量 0.4（40%），避免太大聲；在 1.2 秒內指數衰減到幾乎無聲
  // 使用指數衰減（exponential）比線性衰減更自然，符合人耳感知
  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

  // 立即開始播放，並在 1.2 秒後停止（配合音量衰減的時間）
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 1.2)
}

/**
 * 播放提示音（主要對外介面）
 *
 * 優先使用自訂音效，若瀏覽器封鎖自動播放（autoplay policy）或讀取失敗，
 * 則回退到 Web Audio 合成的預設嗶聲
 * 沒有自訂音效時直接播預設嗶聲
 */
export function playSound() {
  const custom = loadCustomSound()
  if (custom) {
    const audio = new Audio(custom)
    // .play() 回傳 Promise，rejected 代表瀏覽器封鎖播放，此時改用嗶聲作為備案
    audio.play().catch(() => playBeep())
  } else {
    playBeep()
  }
}

/**
 * 檢查是否已有自訂音效
 * 供設定頁面判斷要顯示「使用自訂鈴聲」還是「使用預設嗶聲」的狀態文字
 */
export function hasCustomSound(): boolean {
  return !!loadCustomSound()
}
