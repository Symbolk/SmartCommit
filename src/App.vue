<template>
  <div id="app">
    <NavBar></NavBar>
    <!-- <HelloWorld msg="Welcome to SmartCommit!"/> -->
    <FileCards></FileCards>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import FileCards from './components/FileCards.vue'
import NavBar from './components/NavBar.vue'

export default {
  name: 'app',
  components: {
    NavBar,
    FileCards
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
