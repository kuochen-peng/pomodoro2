<template>
  <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface">

    <div class="flex items-center justify-between p-4 border-b border-surface">
      <h2 class="font-semibold text-color">任務清單</h2>
      <Button label="新增任務" icon="pi pi-plus" size="small" @click="openNew" />
    </div>

    <div class="overflow-x-auto">
    <DataTable :value="taskStore.tasks" class="text-sm">
      <template #empty>
        <div class="text-center py-10 text-muted-color">
          <i class="pi pi-inbox text-3xl mb-2 block"></i>
          <p>還沒有任務，新增一個吧！</p>
        </div>
      </template>

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

      <Column field="title" header="任務名稱">
        <template #body="{ data }">
          <span :class="{ 'line-through opacity-40': data.done }" class="text-color">
            {{ data.title }}
          </span>
        </template>
      </Column>

      <Column header="優先度">
        <template #body="{ data }">
          <Tag :value="priorityLabel(data.priority)" :severity="prioritySeverity(data.priority)" />
        </template>
      </Column>

      <Column header="🍅 進度">
        <template #body="{ data }">
          <span class="text-sm text-muted-color">
            {{ data.completed }} / {{ data.pomodoros }}
          </span>
        </template>
      </Column>

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

  <Dialog v-model:visible="dialogVisible" header="新增任務" modal class="w-full max-w-sm">
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-color">任務名稱 *</label>
        <InputText v-model="form.title" placeholder="輸入任務名稱" class="w-full"
          @keyup.enter="saveTask" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-color">優先度</label>
        <Select v-model="form.priority" :options="priorityOptions"
          optionLabel="label" optionValue="value" class="w-full" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-color">預計番茄數</label>
        <Select v-model="form.pomodoros" :options="[1,2,3,4,5,6,7,8]" class="w-full" />
      </div>
    </div>
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

const priorityOptions = [
  { label: '🔴 高', value: 'high' },
  { label: '🟡 中', value: 'medium' },
  { label: '🔵 低', value: 'low' },
]

const dialogVisible = ref(false)
const form = ref({ title: '', priority: 'medium' as Task['priority'], pomodoros: 2 })

function openNew() {
  form.value = { title: '', priority: 'medium', pomodoros: 2 }
  dialogVisible.value = true
}

function saveTask() {
  if (!form.value.title.trim()) {
    toast.add({ severity: 'warn', summary: '請輸入任務名稱', life: 2000 })
    return
  }
  taskStore.addTask(form.value)
  toast.add({ severity: 'success', summary: '任務已新增', detail: form.value.title, life: 2000 })
  dialogVisible.value = false
}

function deleteTask(task: Task) {
  taskStore.deleteTask(task.id)
  toast.add({ severity: 'info', summary: '已刪除', detail: task.title, life: 2000 })
}

function toggleDone(task: Task) {
  taskStore.toggleDone(task.id)
  // task 是 reactive 代理，toggleDone 後 task.done 已是新值
  if (task.done) {
    toast.add({ severity: 'success', summary: '✅ 任務完成！', detail: task.title, life: 2000 })
  }
}

function priorityLabel(p: string) {
  return { high: '高', medium: '中', low: '低' }[p] ?? p
}
function prioritySeverity(p: string) {
  return { high: 'danger', medium: 'warn', low: 'info' }[p] ?? 'secondary'
}
</script>
