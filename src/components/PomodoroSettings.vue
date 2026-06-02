<!--
  components/PomodoroSettings.vue — 應用設定元件

  提供兩大類設定：
    1. 時間設定：三種模式的計時長度（用 range slider 調整分鐘數）
    2. 鈴聲設定：上傳自訂音效 / 使用預設嗶聲

  設計說明：
    - 時間設定用表單（form reactive 物件）作為中間層，
      讓使用者可以自由調整預覽，不立即生效，
      按下「儲存設定」才寫入 pomodoroStore 並重設計時器
    - 鈴聲設定則即時生效（上傳後立刻寫入 localStorage），
      因為鈴聲不影響進行中的計時狀態
-->
<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-6 flex flex-col gap-6">

    <h2 class="font-semibold text-color">時間設定</h2>

    <!--
      三種模式的時間滑桿
      form 的值以分鐘表示（方便 UI 顯示），store 內部以秒儲存，
      儲存時乘以 60 轉換，讀取時除以 60 還原
    -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <!-- 番茄時間：1–60 分鐘 -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color">🍅 番茄時間</label>
        <div class="flex items-center gap-2">
          <input
            v-model="form.pomodoro"
            type="range" min="1" max="60" step="1"
            class="flex-1"
          />
          <!-- w-12 固定寬度防止數字變動時版面抖動 -->
          <span class="text-sm font-medium text-color w-12 text-right">
            {{ form.pomodoro }} 分
          </span>
        </div>
      </div>

      <!-- 短休息：1–30 分鐘（上限較低，符合短休息的定義） -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color">☕ 短休息</label>
        <div class="flex items-center gap-2">
          <input
            v-model="form.short"
            type="range" min="1" max="30" step="1"
            class="flex-1"
          />
          <span class="text-sm font-medium text-color w-12 text-right">
            {{ form.short }} 分
          </span>
        </div>
      </div>

      <!-- 長休息：1–60 分鐘 -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color">🛋️ 長休息</label>
        <div class="flex items-center gap-2">
          <input
            v-model="form.long"
            type="range" min="1" max="60" step="1"
            class="flex-1"
          />
          <span class="text-sm font-medium text-color w-12 text-right">
            {{ form.long }} 分
          </span>
        </div>
      </div>

    </div>

    <!-- 儲存與恢復預設按鈕 -->
    <div class="flex justify-end gap-2">
      <!-- 恢復預設會直接帶入 25/5/15 並立即儲存，不需再按儲存 -->
      <Button label="恢復預設" icon="pi pi-refresh" text @click="restoreDefault" />
      <Button label="儲存設定" icon="pi pi-check" @click="save" />
    </div>

    <!--
      鈴聲設定區塊
      用 border-t 分隔線視覺上區分兩個設定群組
    -->
    <div class="border-t border-surface pt-6 flex flex-col gap-3">
      <h2 class="font-semibold text-color">🔔 鈴聲設定</h2>

      <div class="flex items-center gap-3 flex-wrap">
        <!-- 目前使用的音效類型 -->
        <span class="text-sm text-muted-color">
          {{ hasCustom ? '✅ 使用自訂鈴聲' : '🔈 使用預設嗶聲' }}
        </span>

        <!-- 試聽按鈕：直接呼叫 useSound 的 playSound，即時預覽目前設定的音效 -->
        <Button label="試聽" icon="pi pi-volume-up" size="small" text @click="playSound" />

        <!--
          上傳自訂音效
          使用 <label> 包裹隱藏的 <input type="file">，點擊 Button 等同點擊 file input
          PrimeVue Button 的 as="span" 讓按鈕渲染為 <span> 而非 <button>，
          避免 <label> 內不能巢狀 <button> 的 HTML 規範問題
        -->
        <label class="cursor-pointer">
          <Button label="上傳鈴聲" icon="pi pi-upload" size="small" outlined as="span" />
          <input
            type="file" accept="audio/*" class="hidden"
            @change="onSoundUpload"
          />
        </label>

        <!-- 只有存在自訂音效時才顯示「恢復預設」按鈕 -->
        <Button
          v-if="hasCustom"
          label="恢復預設" icon="pi pi-times" size="small" text severity="danger"
          @click="removeCustomSound"
        />
      </div>
      <p class="text-xs text-muted-color">支援 MP3、WAV、OGG 等音檔，鈴聲會存在瀏覽器本地。</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { saveCustomSound, clearCustomSound, hasCustomSound, playSound } from '../composables/useSound'
import { usePomodoroStore } from '../stores/pomodoroStore'

const toast = useToast()
const pomodoroStore = usePomodoroStore()

// ── 鈴聲設定 ─────────────────────────────────────────────────────

// 用 ref 追蹤是否有自訂音效，讓模板的 v-if 響應更新
// 初始值從 localStorage 讀取，與目前儲存狀態同步
const hasCustom = ref(hasCustomSound())

/**
 * 使用者選擇音效檔案後觸發
 * 讀取 files[0]（只處理第一個檔案），呼叫 saveCustomSound 轉換並儲存
 * await 確保儲存完成後才更新 hasCustom 狀態並顯示通知
 */
async function onSoundUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await saveCustomSound(file)
  hasCustom.value = true
  toast.add({ severity: 'success', summary: '鈴聲已更新', detail: file.name, life: 2000 })
}

/** 清除自訂音效，改回預設嗶聲 */
function removeCustomSound() {
  clearCustomSound()
  hasCustom.value = false
  toast.add({ severity: 'info', summary: '已恢復預設鈴聲', life: 2000 })
}
// ─────────────────────────────────────────────────────────────────

// 時間設定表單：以分鐘為單位，從 store 換算（store 用秒）
// 使用獨立的 form 物件作為中間層，讓使用者可以自由預覽調整後的值
const form = reactive({
  pomodoro: pomodoroStore.settings.pomodoro / 60,
  short: pomodoroStore.settings.short / 60,
  long: pomodoroStore.settings.long / 60,
})

/**
 * 儲存時間設定
 * 將分鐘轉回秒數寫入 store（store 以秒儲存，方便計時器直接使用）
 * 呼叫 pomodoroStore.reset() 讓計時器立即套用新的時間設定
 */
function save() {
  pomodoroStore.settings.pomodoro = form.pomodoro * 60
  pomodoroStore.settings.short = form.short * 60
  pomodoroStore.settings.long = form.long * 60
  pomodoroStore.reset() // 重設計時器讓新設定立即生效
  toast.add({ severity: 'success', summary: '設定已儲存', life: 2000 })
}

/**
 * 恢復番茄工作法的標準預設值（25 / 5 / 15 分鐘）
 * 先更新表單再呼叫 save()，避免重複寫邏輯
 */
function restoreDefault() {
  form.pomodoro = 25
  form.short = 5
  form.long = 15
  save()
}
</script>
