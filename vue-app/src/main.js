import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import Icon from 'vue-awesome/components/Icon'

import './assets/cards.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'vue-awesome/icons/check'
import 'vue-awesome/icons/eraser'
import 'vue-awesome/icons/hand-spock'

Vue.config.productionTip = false
Vue.component('v-icon', Icon)

Vue.use(BootstrapVue)

new Vue({
  render: h => h(App)
}).$mount('#app')
