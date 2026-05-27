import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Task } from '@/types/task'

const STORAGE_KEY = 'pomodoro-tasks'

export const useTaskStore = defineStore('task', () => {
  function loadTasks(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const tasks = reactive<Task[]>(loadTasks())

  watch(
    () => JSON.stringify(tasks),
    (val) => localStorage.setItem(STORAGE_KEY, val),
  )

  function addTask(task: Omit<Task, 'id' | 'completed' | 'done'>) {
    const newId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1
    tasks.push({ id: newId, ...task, completed: 0, done: false })
  }

  function deleteTask(id: number) {
    const idx = tasks.findIndex(t => t.id === id)
    if (idx !== -1) tasks.splice(idx, 1)
  }

  function toggleDone(id: number) {
    const task = tasks.find(t => t.id === id)
    if (task) task.done = !task.done
  }

  function incrementCompleted(id: number) {
    const task = tasks.find(t => t.id === id)
    if (task && !task.done) {
      task.completed++
      if (task.completed >= task.pomodoros) task.done = true
    }
  }

  return { tasks, addTask, deleteTask, toggleDone, incrementCompleted }
})
