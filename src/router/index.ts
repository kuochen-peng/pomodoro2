import { createRouter, createWebHashHistory } from 'vue-router'
import defaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: defaultLayout,
      children: [
        {path: '', component: () => import('@/pages/PomodoroPage.vue'), meta: {title: 'Pomodoro | 首頁'}},
        {path: 'tasks', component: () => import('@/pages/TasksPage.vue'), meta: {title: 'Pomodoro | 任務'}},
        {path: 'stats', component: () => import('@/pages/StatsPage.vue'), meta: {title: 'Pomodoro | 統計'}},
        {path: 'settings', component: () => import('@/pages/SettingsPage.vue'), meta: {title: 'Pomodoro | 設定'}}
      ],
    },
  ],
})

router.afterEach(to => {
  document.title = to.meta.title ?? 'Pomodoro'
})

export default router
