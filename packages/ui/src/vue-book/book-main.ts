import { createApp } from 'vue'
import App from './BookApp.vue'
import { ColorThemePlugin } from '../services/ColorThemePlugin'
import DropdownPopperSubplugin from '../components/vuestic-components/va-dropdown/dropdown-popover-subplugin'
import ColorHelpersPlugin from '../components/vuestic-utilities/color-helpers-plugin'
import ToastInstall from '../components/vuestic-components/va-toast/install'

import { VueBookComponents, createRoute } from 'vue-book'
import { createRouter, createWebHashHistory } from 'vue-router'

console.log(`Version: ${VERSION}, ${TIMESTAMP}, commit: ${COMMIT}`)

const app = createApp(App)

const routes = [
  createRoute({
    requireContext: require.context('../components', true, /.demo.vue$/),
    path: '/demo',
  }),
  {
    path: '/:pathMatch(.*)*',
    redirect: '/demo',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

app.use(ColorHelpersPlugin)
app.use(ColorThemePlugin)
app.use(VueBookComponents)
app.use(ToastInstall)
app.use(DropdownPopperSubplugin)
app.use(router)

app.mount('#app')
