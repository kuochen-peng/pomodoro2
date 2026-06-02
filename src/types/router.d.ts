/**
 * types/router.d.ts — Vue Router RouteMeta 型別擴充
 *
 * Vue Router 的 meta 欄位預設型別為 Record<string, any>，
 * 沒有 TypeScript 的自動補全與型別檢查。
 * 透過 Declaration Merging（宣告合併）的方式擴充 RouteMeta 介面，
 * 讓路由設定中的 meta.title 有明確型別，並且在使用時有 IDE 提示。
 */

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 瀏覽器分頁標題；router/index.ts 的 afterEach 會讀取此值並更新 document.title */
    title?: string
  }
}
