/**
 * vite.config.ts — Vite 建置設定
 *
 * 設定應用的開發與生產建置流程，包含：
 *   - Vue 單檔元件支援
 *   - Tailwind CSS v4 整合
 *   - PWA（漸進式 Web 應用）支援
 *   - 路徑別名（@ → src/）
 */

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'              // 讓 Vite 能處理 .vue 單檔元件
import vueDevTools from 'vite-plugin-vue-devtools' // 在開發環境加入 Vue DevTools 面板
import tailwindcss from '@tailwindcss/vite'        // Tailwind CSS v4 的 Vite 原生插件（不需 postcss.config.js）
import { VitePWA } from 'vite-plugin-pwa'          // 自動生成 Service Worker 與 Web App Manifest

export default defineConfig({
  // 使用 './' 相對路徑作為資源根目錄，讓應用可以直接用瀏覽器開啟 index.html（無需伺服器）
  // 搭配 Hash 路由，不需任何後端 URL rewrite 即可部署到任意靜態伺服器或 GitHub Pages
  base: './',

  plugins: [
    // 核心：處理 .vue 單檔元件（<template> / <script> / <style>）
    vue(),

    // 開發工具：在開發環境的頁面中注入 Vue DevTools UI
    vueDevTools(),

    // Tailwind CSS v4：直接整合在 Vite 管道中，比 PostCSS 版本更快
    tailwindcss(),

    // PWA 插件：讓應用可以安裝到裝置主畫面，並在離線時正常運作
    VitePWA({
      // 開發環境也啟用 Service Worker，方便測試 PWA 功能（如通知、離線）
      devOptions: {
        enabled: true
      },

      // 新版本部署後 Service Worker 自動更新，使用者不需手動重新整理
      registerType: 'autoUpdate',

      workbox: {
        // 清除舊版本 Service Worker 快取的過期資源
        cleanupOutdatedCaches: true,
        // 快取所有靜態資源（JS / CSS / 圖片等），讓應用可以完全離線使用
        globPatterns: ['**/*'],
        // 忽略 URL 查詢參數的差異，避免相同資源因參數不同被快取為不同版本
        ignoreURLParametersMatching: [/.*/]
      },

      // Web App Manifest：讓瀏覽器識別此應用為可安裝的 PWA
      manifest: {
        name: "Pomodoro",              // 完整應用名稱（安裝時顯示）
        short_name: "Pomodoro",        // 短名稱（主畫面圖示下方顯示）
        icons: [
          // 192x192：一般裝置主畫面圖示
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          // 512x512：高解析度裝置、啟動畫面
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          }
        ],
        theme_color: "#ffffff",          // 瀏覽器 UI（頂部工具列）的顏色
        background_color: "#ffffff",     // 啟動畫面的背景色
        display: "standalone",           // 全螢幕模式（隱藏瀏覽器工具列），讓 PWA 像原生 app
        start_url: './',                 // 安裝後點擊圖示的進入 URL
        scope: './',                     // Service Worker 的控制範圍
      },
    }),
  ],

  resolve: {
    alias: {
      // 將 '@' 映射到 src/ 目錄，讓 import 路徑更簡潔
      // 例：import X from '@/stores/taskStore' 而非 '../../stores/taskStore'
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
