import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import VModal from 'vue-js-modal'
import Icon from 'vue-awesome/components/Icon'

import './assets/cards.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'vue-awesome/icons/check'
import 'vue-awesome/icons/eraser'

Vue.config.productionTip = false
Vue.component('v-icon', Icon)
Vue.use(BootstrapVue)
Vue.use(VModal)

new Vue({
  render: h => h(App),
}).$mount('#app')