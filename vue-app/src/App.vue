<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <FileGroups></FileGroups>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import FileGroups from './components/FileGroups.vue'

export default {
  name: 'app',
  components: {
    HelloWorld,
    FileGroups
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
