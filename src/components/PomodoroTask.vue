<!--
  components/PomodoroTask.vue — 任務清單元件

  提供完整的任務管理 UI：
    - 用 DataTable 顯示所有任務（狀態、名稱、優先度、番茄進度、刪除）
    - 用 Dialog 彈窗新增任務（名稱、優先度、預計番茄數）
    - 操作完成後透過 Toast 給予使用者即時反饋

  元件只負責 UI 互動，資料的增刪改查全委託給 taskStore
-->
<template>
  <!-- 任務清單卡片容器 -->
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface">

    <!-- 卡片頂部：標題 + 新增按鈕 -->
    <div class="flex items-center justify-between p-4 border-b border-surface">
      <h2 class="font-semibold text-color">任務清單</h2>
      <Button label="新增任務" icon="pi pi-plus" size="small" @click="openNew" />
    </div>

    <!-- overflow-x-auto 讓資料表在小螢幕可橫向滾動，避免排版破版 -->
    <div class="overflow-x-auto">
      <DataTable :value="taskStore.tasks" class="text-sm">

        <!-- 空列表時的佔位提示 -->
        <template #empty>
          <div class="text-center py-10 text-muted-color">
            <i class="pi pi-inbox text-3xl mb-2 block"></i>
            <p>還沒有任務，新增一個吧！</p>
          </div>
        </template>

        <!--
          狀態欄：以圓圈圖示表示完成狀態
          點擊可切換 done，已完成顯示綠色打勾，未完成顯示灰色空圓
        -->
        <Column header="狀態">
          <template #body="{ data }">
            <Button
              :icon="data.done ? 'pi pi-check-circle' : 'pi pi-circle'"
              text rounded size="small"
              :severity="data.done ? 'success' : 'secondary'"
              @click="toggleDone(data)"
            />
          </template>
        </Column>

        <!--
          任務名稱欄：已完成的任務套用刪除線 + 半透明，視覺上明顯區分完成狀態
          使用 field="title" 讓 DataTable 可以對此欄排序（如有需要）
        -->
        <Column field="title" header="任務名稱">
          <template #body="{ data }">
            <span :class="{ 'line-through opacity-40': data.done }" class="text-color">
              {{ data.title }}
            </span>
          </template>
        </Column>

        <!-- 優先度欄：用 Tag 元件顯示彩色標籤，顏色對應 prioritySeverity() 的回傳值 -->
        <Column header="優先度">
          <template #body="{ data }">
            <Tag :value="priorityLabel(data.priority)" :severity="prioritySeverity(data.priority)" />
          </template>
        </Column>

        <!-- 番茄進度欄：顯示「已完成 / 預計」的數字進度 -->
        <Column header="🍅 進度">
          <template #body="{ data }">
            <span class="text-sm text-muted-color">
              {{ data.completed }} / {{ data.pomodoros }}
            </span>
          </template>
        </Column>

        <!-- 刪除欄：固定 56px 寬度，只顯示垃圾桶按鈕 -->
        <Column style="width: 56px">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash" text rounded size="small"
              severity="danger"
              @click="deleteTask(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!--
    新增任務彈窗
    v-model:visible 控制顯示/隱藏
    modal 讓背景遮罩阻擋點擊，確保使用者完成表單才能離開
  -->
  <Dialog v-model:visible="dialogVisible" header="新增任務" modal class="w-full max-w-sm">
    <div class="flex flex-col gap-4 pt-2">

      <!-- 任務名稱輸入（必填）：支援 Enter 鍵直接送出 -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-color">任務名稱 *</label>
        <InputText v-model="form.title" placeholder="輸入任務名稱" class="w-full"
          @keyup.enter="saveTask" />
      </div>

      <!-- 優先度選擇：預設中等，選項對應 Task.priority 的聯合型別 -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-color">優先度</label>
        <Select v-model="form.priority" :options="priorityOptions"
          optionLabel="label" optionValue="value" class="w-full" />
      </div>

      <!-- 預計番茄數：1–8 個，對應每日番茄工作法建議的合理範圍 -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-color">預計番茄數</label>
        <Select v-model="form.pomodoros" :options="[1,2,3,4,5,6,7,8]" class="w-full" />
      </div>
    </div>

    <!-- 彈窗底部按鈕 -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="取消" text @click="dialogVisible = false" />
        <Button label="新增" icon="pi pi-check" @click="saveTask" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useTaskStore } from '../stores/taskStore'
import type { Task } from '../types/task'

const taskStore = useTaskStore()
const toast = useToast()

// 優先度選單選項：使用 emoji 讓視覺辨識更快
const priorityOptions = [
  { label: '🔴 高', value: 'high' },
  { label: '🟡 中', value: 'medium' },
  { label: '🔵 低', value: 'low' },
]

// 彈窗的顯示/隱藏狀態
const dialogVisible = ref(false)

// 新增任務的暫存表單資料
// 每次開啟彈窗時重置（見 openNew），避免上次的輸入殘留
const form = ref({ title: '', priority: 'medium' as Task['priority'], pomodoros: 2 })

/** 開啟新增任務彈窗，並重置表單為預設值 */
function openNew() {
  form.value = { title: '', priority: 'medium', pomodoros: 2 }
  dialogVisible.value = true
}

/**
 * 儲存任務
 * 驗證名稱不為空白後，呼叫 taskStore 新增，並關閉彈窗
 * trim() 避免只輸入空格的任務被誤存
 */
function saveTask() {
  if (!form.value.title.trim()) {
    toast.add({ severity: 'warn', summary: '請輸入任務名稱', life: 2000 })
    return
  }
  taskStore.addTask(form.value)
  toast.add({ severity: 'success', summary: '任務已新增', detail: form.value.title, life: 2000 })
  dialogVisible.value = false
}

/** 刪除任務並顯示確認通知 */
function deleteTask(task: Task) {
  taskStore.deleteTask(task.id)
  toast.add({ severity: 'info', summary: '已刪除', detail: task.title, life: 2000 })
}

/**
 * 切換任務完成狀態
 * 注意：task 是 reactive 代理，呼叫 toggleDone 後 task.done 已是新值，
 * 所以直接讀取 task.done 就能得到切換後的結果
 * 只有切換到「完成」時顯示慶祝通知，取消完成不做額外提示
 */
function toggleDone(task: Task) {
  taskStore.toggleDone(task.id)
  if (task.done) {
    toast.add({ severity: 'success', summary: '✅ 任務完成！', detail: task.title, life: 2000 })
  }
}

/** 優先度的中文標籤（顯示在 Tag 元件內） */
function priorityLabel(p: string) {
  return { high: '高', medium: '中', low: '低' }[p] ?? p
}

/** 優先度對應 PrimeVue Tag 的 severity（決定顏色） */
function prioritySeverity(p: string) {
  return { high: 'danger', medium: 'warn', low: 'info' }[p] ?? 'secondary'
}
</script>
