export interface Task {
  id: number
  title: string
  priority: 'high' | 'medium' | 'low'
  pomodoros: number
  completed: number
  done: boolean
}
