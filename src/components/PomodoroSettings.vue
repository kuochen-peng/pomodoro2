<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface p-6 flex flex-col gap-6">

    <h2 class="font-semibold text-color">時間設定</h2>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color">🍅 番茄時間</label>
        <div class="flex items-center gap-2">
          <input
            v-model="form.pomodoro"
            type="range" min="1" max="60" step="1"
            class="flex-1"
          />
          <span class="text-sm font-medium text-color w-12 text-right">
            {{ form.pomodoro }} 分
          </span>
        </div>
      </div>

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

    <div class="flex justify-end gap-2">
      <Button label="恢復預設" icon="pi pi-refresh" text @click="restoreDefault" />
      <Button label="儲存設定" icon="pi pi-check" @click="save" />
    </div>

    <!-- 鈴聲設定 -->
    <div class="border-t border-surface pt-6 flex flex-col gap-3">
      <h2 class="font-semibold text-color">🔔 鈴聲設定</h2>

      <div class="flex items-center gap-3 flex-wrap">
        <!-- 目前狀態 -->
        <span class="text-sm text-muted-color">
          {{ hasCustom ? '✅ 使用自訂鈴聲' : '🔈 使用預設嗶聲' }}
        </span>

        <!-- 試聽 -->
        <Button label="試聽" icon="pi pi-volume-up" size="small" text @click="playSound" />

        <!-- 上傳自訂音效 -->
        <label class="cursor-pointer">
          <Button label="上傳鈴聲" icon="pi pi-upload" size="small" outlined as="span" />
          <input
            type="file" accept="audio/*" class="hidden"
            @change="onSoundUpload"
          />
        </label>

        <!-- 清除自訂 -->
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

// ── 鈴聲設定 ──────────────────────────────────────────────
const hasCustom = ref(hasCustomSound())

async function onSoundUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await saveCustomSound(file)
  hasCustom.value = true
  toast.add({ severity: 'success', summary: '鈴聲已更新', detail: file.name, life: 2000 })
}

function removeCustomSound() {
  clearCustomSound()
  hasCustom.value = false
  toast.add({ severity: 'info', summary: '已恢復預設鈴聲', life: 2000 })
}
// ─────────────────────────────────────────────────────────

const form = reactive({
  pomodoro: pomodoroStore.settings.pomodoro / 60,
  short: pomodoroStore.settings.short / 60,
  long: pomodoroStore.settings.long / 60,
})

function save() {
  pomodoroStore.settings.pomodoro = form.pomodoro * 60
  pomodoroStore.settings.short = form.short * 60
  pomodoroStore.settings.long = form.long * 60
  pomodoroStore.reset()
  toast.add({ severity: 'success', summary: '設定已儲存', life: 2000 })
}

function restoreDefault() {
  form.pomodoro = 25
  form.short = 5
  form.long = 15
  save()
}
</script>
