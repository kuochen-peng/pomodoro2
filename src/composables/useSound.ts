const STORAGE_KEY = 'pomodoro-custom-sound'

/** 讀取自訂音效（base64 data URL），沒有就回傳 null */
function loadCustomSound(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

/** 儲存自訂音效（base64 data URL） */
export function saveCustomSound(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      localStorage.setItem(STORAGE_KEY, reader.result as string)
      resolve()
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** 清除自訂音效，改回預設嗶聲 */
export function clearCustomSound() {
  localStorage.removeItem(STORAGE_KEY)
}

/** 用 Web Audio API 產生預設嗶聲 */
function playBeep() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.value = 880

  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 1.2)
}

/** 播放鈴聲（有自訂音效就播自訂，否則播預設嗶聲） */
export function playSound() {
  const custom = loadCustomSound()
  if (custom) {
    const audio = new Audio(custom)
    audio.play().catch(() => playBeep()) // 若瀏覽器封鎖就改用嗶聲
  } else {
    playBeep()
  }
}

/** 是否已有自訂音效 */
export function hasCustomSound(): boolean {
  return !!loadCustomSound()
}
