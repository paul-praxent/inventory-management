import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

// Self-hosted type: Barlow for body/UI text, Barlow Semi Condensed for
// headings/labels. Loaded via @fontsource so the woff2 files ship in the
// build (no external font request, works offline) - see App.vue's `body`
// font-family declaration for the fallback stack.
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-semi-condensed/700.css'
import '@fontsource/barlow-semi-condensed/800.css'

import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Inventory from './views/Inventory.vue'
import Orders from './views/Orders.vue'
import Demand from './views/Demand.vue'
import Spending from './views/Spending.vue'
import Reports from './views/Reports.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/inventory', component: Inventory },
    { path: '/orders', component: Orders },
    { path: '/demand', component: Demand },
    { path: '/spending', component: Spending },
    { path: '/reports', component: Reports }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
