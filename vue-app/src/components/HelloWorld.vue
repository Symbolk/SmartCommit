<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <!-- testing -->
    <!-- <MonacoEditor height="200" theme="vs-light" language="javascript" :value="code"></MonacoEditor> -->
    <!-- <MonacoEditor
      class="editor"
      :value="code"
      :original="code"
      :diffEditor="true"
      language="javascript"
    /> -->
  </div>
</template>

<script>
import MonacoEditor from "monaco-editor-vue";
// import MonacoEditor from "vue-monaco";

export default {
  name: "HelloWorld",

  components: { MonacoEditor },

  props: {
    msg: String
  },

  data() {
    return {
      code: "const noop = () => {}"
    };
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 {
  text-align: center;
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

.editor {
  width: 600px;
  height: 800px;
}
</style>
