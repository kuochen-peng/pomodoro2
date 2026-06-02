/**
 * router/index.ts — 路由設定
 *
 * 定義 URL 路徑與頁面元件的對應關係。
 * 使用 Hash 模式（#/path），好處是部署到靜態伺服器或本地開啟 HTML 檔案時，
 * 不需要伺服器端的 URL rewrite，所有路由都能正常運作。
 *
 * 架構說明：
 *   / (DefaultLayout)            ← 外框：含導覽列的主版型
 *   ├── ''          → PomodoroPage   （計時器首頁）
 *   ├── tasks       → TasksPage      （任務清單）
 *   ├── stats       → StatsPage      （統計圖表）
 *   └── settings    → SettingsPage   （應用設定）
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import defaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  // createWebHashHistory 使用 URL 的 # 片段作為路由，不需後端配合
  // import.meta.env.BASE_URL 讀取 vite.config.ts 中的 base 設定（目前為 './'）
  history: createWebHashHistory(import.meta.env.BASE_URL),

  routes: [
    {
      // 根路徑套用 DefaultLayout（包含 header 與 <main> 容器）
      path: '/',
      component: defaultLayout,
      children: [
        // 首頁（計時器）：path 為空字串代表與父路由完全匹配
        // 使用動態 import() 做程式碼分割，首次訪問時才下載對應 chunk，加快初始載入
        { path: '',         component: () => import('@/pages/PomodoroPage.vue'),  meta: { title: 'Pomodoro | 首頁' } },
        // 任務頁
        { path: 'tasks',    component: () => import('@/pages/TasksPage.vue'),     meta: { title: 'Pomodoro | 任務' } },
        // 統計頁
        { path: 'stats',    component: () => import('@/pages/StatsPage.vue'),     meta: { title: 'Pomodoro | 統計' } },
        // 設定頁
        { path: 'settings', component: () => import('@/pages/SettingsPage.vue'),  meta: { title: 'Pomodoro | 設定' } },
      ],
    },
  ],
})

// 每次路由切換完成後，更新瀏覽器分頁的標題
// 使用 afterEach（導航後）而非 beforeEach，確保標題只在頁面確定顯示後才更新
// meta.title 若未定義則回退到 'Pomodoro'
router.afterEach(to => {
  document.title = to.meta.title ?? 'Pomodoro'
})

export default router
