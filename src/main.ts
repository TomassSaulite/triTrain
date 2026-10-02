import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { registerServiceWorker } from './pwa'
import { router } from './router'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')
registerServiceWorker()
