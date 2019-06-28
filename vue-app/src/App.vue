<template>
  <div id="app">
    <Header></Header>
    <!-- <HelloWorld msg="Welcome to SmartCommit!"/> -->
    <FileCards></FileCards>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import FileCards from "./components/FileCards.vue";
import Header from "./components/Header.vue";

export default {
  name: "app",
  components: {
    Header,
    HelloWorld,
    FileCards
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* text-align: center; */
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
