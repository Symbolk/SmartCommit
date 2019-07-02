<template>
  <div id="app">
    <MonacoEditor
      :diffEditor="true"
      :options="options"
      :original="left"
      :value="right"
      height="500"
      language="javascript"
      width="800"
    ></MonacoEditor>
  </div>
</template>

<script>
import MonacoEditor from 'monaco-editor-vue'
export default {
  name: 'App',
  components: {
    MonacoEditor
  },
  data() {
    return {
      options: {
        //Monaco Editor Options
      },
      left: `import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
`,
      right: `module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
`
    }
  }
}
</script>