import Vue from 'vue'
import App from './App.vue'
import {BootstrapVue, BootstrapVueIcons} from 'bootstrap-vue'
import Icon from 'vue-awesome/components/Icon'
import vuescroll from 'vuescroll/dist/vuescroll'

import './assets/cards.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'vue-awesome/icons/check'
import 'vue-awesome/icons/eraser'
import 'vue-awesome/icons/hand-spock'

import router from './router.js'

Vue.config.productionTip = false
Vue.component('v-icon', Icon)

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)
Vue.use(vuescroll)

new Vue({
  router,
  render: h => h(App),
  created() {
    this.$router.push('/file')
  }
}).$mount('#app')
