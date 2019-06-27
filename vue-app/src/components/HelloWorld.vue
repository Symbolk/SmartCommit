<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <!-- testing -->
    <!-- <MonacoEditor height="200" theme="vs-light" language="javascript" value="const gitutils = require('./gitutils');"></MonacoEditor> -->
  </div>
</template>

<script>
import MonacoEditor from "monaco-editor-vue";

export default {
  name: "HelloWorld",

  components: { MonacoEditor },

  props: {
    msg: String
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
