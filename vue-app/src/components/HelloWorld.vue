<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <b-button variant="primary" @click="setLang('javascript')"></b-button>
    <!-- testing -->
    <!-- <MonacoEditor height="200" theme="vs-light" language="javascript" :value="code"></MonacoEditor> -->
    <MonacoEditor
      ref="diffViewEditor"
      class="editor"
      :value="code_left"
      :original="code_right"
      :diffEditor="true"
    />
  </div>
</template>

<script>
// import MonacoEditor from "monaco-editor-vue";
import MonacoEditor from "vue-monaco";
const monaco = require("monaco-editor");

export default {
  name: "HelloWorld",

  components: { MonacoEditor },

  props: {
    msg: String
  },

  data() {
    return {
      code_left: "const noop = () => {}",
      code_right: `function foo() {
  return 'foo'
    }`
    };
  },

  methods: {
    setLang(lang) {
      monaco.editor.setModelLanguage(
        this.$refs.diffViewEditor.getModifiedEditor().getModel(),
        lang
      );
    }
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
