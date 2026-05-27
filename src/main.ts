import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.my-app-dark',
    }
  }
})
app.use(ToastService)
app.use(createPinia())
app.use(router)

app.mount('#app')
