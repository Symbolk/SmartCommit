import Vue from 'vue'
import VueRouter from 'vue-router'
import FileView from './components/FileView.vue'
import ChangeView from './components/ChangeView.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    {
      path: '/file',
      name: 'File View',
      component: FileView
    },
    {
      path: '/change',
      name: 'Change View',
      component: ChangeView
    }
  ]
})
