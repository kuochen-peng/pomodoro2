/**
 * main.ts — 應用程式進入點
 *
 * 負責建立 Vue 應用實例、掛載所有全域套件，最後將根元件
 * 掛載到 index.html 的 <div id="app">。
 * 所有套件必須在 app.mount() 之前 use()，否則子元件無法使用。
 */

import { createApp } from 'vue'      // Vue 核心，用來建立應用實例
import { createPinia } from 'pinia'  // Pinia：Vue 3 官方推薦的全域狀態管理庫
import './style.css'                  // 全域 CSS（Tailwind 指令 + 自訂樣式）
import 'primeicons/primeicons.css'   // PrimeIcons 字型圖示，讓 `pi pi-*` class 可用

import App from './App.vue'          // 根元件，所有頁面都是它的子孫
import router from './router'        // Vue Router 設定（路由對應頁面）
import PrimeVue from 'primevue/config'     // PrimeVue UI 框架
import ToastService from 'primevue/toastservice' // Toast 通知服務（需全域註冊才能在任何元件用 useToast()）
import Aura from '@primeuix/themes/aura'   // PrimeVue 的 Aura 佈景主題

const app = createApp(App)

// 啟用 PrimeVue，並套用 Aura 主題
// darkModeSelector 指定深色模式的 CSS class；當 <html> 有此 class 時切換深色
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.my-app-dark',
    }
  }
})

// 啟用 Toast 通知服務（操作完成 / 錯誤提示）
// 必須全域 use()，才能在各元件透過 useToast() 取得實例
app.use(ToastService)

// 啟用 Pinia 狀態管理；建立一個全域 Store 容器
app.use(createPinia())

// 啟用 Vue Router；路由設定在 src/router/index.ts
app.use(router)

// 將整個應用掛載到 index.html 的 <div id="app">，應用正式啟動
app.mount('#app')
