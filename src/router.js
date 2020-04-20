import Vue from 'vue'
import VueRouter from 'vue-router'
import FileView from './components/FileView.vue'
import ChangeView from './components/ChangeView.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    {
      path: '/files',
      name: 'File View',
      component: FileView
    },
    {
      path: '/changes',
      name: 'Change View',
      component: ChangeView
    }
  ]
})
