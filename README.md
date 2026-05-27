# Pomodoro | 番茄鐘

> 透過「短時間的深度專注」與「定期的休息」交替，提高工作效率並減少大腦疲勞。

---

## 專案簡介

番茄工作法的核心概念：將工作切分為 **25 分鐘的專注區間**（一顆番茄），每顆番茄之間安排短暫休息，累積四顆後進行長休息，讓大腦在規律的節奏中維持高效運作。

本專案除了計時核心外，也整合了**任務管理**與**統計圖表**，讓使用者能一站式掌握自己的工作節奏與完成進度，並支援 PWA 安裝，可於桌面或手機離線使用。

---

## 功能特色

- **番茄計時器** — 專注 25 分鐘，自動切換短休息（5 分）與長休息（15 分）
- **任務清單** — 新增任務、設定優先度、追蹤番茄進度
- **統計圖表** — 以圖表呈現每日完成的番茄數
- **瀏覽器通知** — 計時結束時推送系統通知

---

## 使用技術

| 技術                                                 | 版本    | 用途                                   |
| ---------------------------------------------------- | ------- | -------------------------------------- |
| [Vue 3](https://vuejs.org/) + Composition API        | ^3.5.32 | 主框架，採用 Composition API 組織邏輯  |
| [TypeScript](https://www.typescriptlang.org/)        | ~6.0.0  | 靜態型別，提升程式碼可維護性           |
| [Vue Router](https://router.vuejs.org/)              | ^5.0.4  | 管理頁面切換與導航                     |
| [Pinia](https://pinia.vuejs.org/)                    | ^3.0.4  | 全域狀態（計時、任務、歷史紀錄）       |
| [PrimeVue 4](https://primevue.org/)                  | ^4.5.5  | 現成 UI 元件庫（按鈕、對話框、表格等） |
| [Tailwind CSS v4](https://tailwindcss.com/)          | ^4.3.0  | Utility-first CSS，快速排版與 RWD      |
| [VueUse](https://vueuse.org/)                        | ^14.3.0 | 常用 Composable（通知、媒體查詢等）    |
| [Chart.js](https://www.chartjs.org/)                 | ^4.5.1  | 繪製每日番茄完成數長條圖               |
| [Vite](https://vitejs.dev/)                          | ^8.0.8  | 快速開發伺服器與生產打包               |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1.3.0  | 離線快取與安裝至主畫面支援             |
| [GitHub Pages](https://pages.github.com/)            | —       | 靜態網站免費托管                       |

---

## 專案結構

```
src/
├── components/   # 可重用元件（計時器、任務、圖表）
├── pages/        # 頁面元件
├── stores/       # Pinia 狀態（計時、任務、歷史紀錄）
├── composables/  # 自訂 Composable（音效）
├── layouts/      # 版面配置
├── router/       # Vue Router 路由設定
└── types/        # TypeScript 型別定義
```
