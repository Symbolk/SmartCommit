<template>
  <div class="card-scene">
    <Container
      v-if="isReady"
      orientation="horizontal"
      @drop="onColumnDrop($event)"
      drag-handle-selector=".column-drag-handle"
      @drag-start="dragStart"
      :drop-placeholder="upperDropPlaceholderOptions"
    >
      <Draggable v-for="column in scene.children" :key="column.id">
        <div :class="column.props.className">
          <div class="card-column-header">
            <span class="column-drag-handle">&#x2630;</span>
            {{ column.name }}
          </div>
          <Container
            group-name="col"
            @drop="(e) => onCardDrop(column.id, e)"
            @drag-start="(e) => log('drag start', e)"
            @drag-end="(e) => log('drag end', e)"
            :get-child-payload="getCardPayload(column.id)"
            drag-class="card-ghost"
            drop-class="card-ghost-drop"
            :drop-placeholder="dropPlaceholderOptions"
          >
            <Draggable v-for="card in column.children" :key="card.id">
              <div
                :class="card.props.className"
                :style="card.props.style"
                class="no-select"
                @dblclick="onShow(card.data)"
              >
                <p class="no-select">{{ card.data }}</p>
              </div>
            </Draggable>
          </Container>
        </div>
      </Draggable>
    </Container>
    <vodal
      measure="em"
      :show="show"
      :animation="animation"
      :width="28.5"
      :height="17"
      :duration="301"
      class="my-dialog"
      @hide="show = false"
    >
      <div class="header">{{modalHeader}}</div>
          <!-- <MonacoEditor
      :diffEditor="true"
      original="..."></MonacoEditor> -->
          <MonacoEditor
                height="300"
                width="1200"
                language="javascript"
                :code="code"
                :editorOptions="options"
                @mounted="onMounted"
                @codeChange="onCodeChange"
                >
        </MonacoEditor>
    </vodal>
  </div>
</template>

<script>
import { Container, Draggable } from "vue-smooth-dnd";
import { applyDrag, generateItems } from "./utils/helpers";
import { getDiffFiles, analyzeStatus2 } from "./utils/gitutils";
// import MonacoEditor from 'monaco-editor-vue';
var MonacoEditor =require( 'vue-monaco-editor')

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

const columnNames = ["Lorem", "Ipsum", "Consectetur", "Eiusmod"];

const cardColors = [
  "azure",
  "beige",
  "bisque",
  "blanchedalmond",
  "burlywood",
  "cornsilk",
  "gainsboro",
  "ghostwhite",
  "ivory",
  "khaki"
];

var diffFiles = {
  nodes: [],
  links: []
};
// (async () => {
//   diffFiles = await getDiffFiles("");
//   console.log("in");
//   console.log(diffFiles);
// })();
// console.log("out");
// console.log(diffFiles);

// getDiffFiles("").then(res => {
//   console.log("then");
//   console.log(res);
// });

const pickColor = () => {
  const rand = Math.floor(Math.random() * 10);
  return cardColors[rand];
};

var scene = {
  type: "container",
  props: {
    orientation: "horizontal"
  },
  children: []
};

export default {
  name: "Cards",

  components: { Container, Draggable, MonacoEditor },

  data() {
    return {
      scene,
      upperDropPlaceholderOptions: {
        className: "cards-drop-preview",
        animationDuration: "150",
        showOnTop: true
      },
      dropPlaceholderOptions: {
        className: "drop-preview",
        animationDuration: "150",
        showOnTop: true
      },
      // async analyzing git repo
      isReady: false,
      show: false,
      animation: "",
      modalHeader: "",

      code: '<MonacoEditor language="typescript" :code="code" :editorOptions="options" @mounted="onMounted" @codeChange="onCodeChange"></MonacoEditor>',
      options: {
        selectOnLineNumbers: true
      }
    };
  },

  methods: {
    onColumnDrop(dropResult) {
      const scene = Object.assign({}, this.scene);
      scene.children = applyDrag(scene.children, dropResult);
      this.scene = scene;
    },

    onCardDrop(columnId, dropResult) {
      if (dropResult.removedIndex !== null || dropResult.addedIndex !== null) {
        const scene = Object.assign({}, this.scene);
        const column = scene.children.filter(p => p.id === columnId)[0];
        const columnIndex = scene.children.indexOf(column);

        const newColumn = Object.assign({}, column);
        newColumn.children = applyDrag(newColumn.children, dropResult);
        scene.children.splice(columnIndex, 1, newColumn);

        this.scene = scene;
      }
    },

    getCardPayload(columnId) {
      return index => {
        return this.scene.children.filter(p => p.id === columnId)[0].children[
          index
        ];
      };
    },

    dragStart() {
      console.log("drag started");
    },

    log(...params) {
      console.log(...params);
    },

    onShow(data) {
      this.animation = "door";
      this.show = true;
      this.modalHeader = data;
    }
  },
  created() {
    getDiffFiles("").then(res => {
      console.log("then");
      console.log(res);

      this.scene = {
        type: "container",
        props: {
          orientation: "horizontal"
        },
        children: generateItems(4, i => ({
          id: `column${i}`,
          type: "container",
          name: columnNames[i],
          props: {
            orientation: "vertical",
            className: "card-container"
          },
          children: generateItems(res.nodes.length, j => ({
            type: "draggable",
            id: `${i}${j}`,
            props: {
              className: "card",
              style: { backgroundColor: pickColor() }
            },
            data: res.nodes[j].name
          }))
        }))
      };
      this.isReady = true;
      console.log(scene);
    });
  }
};
</script>

<style>
@import "../assets/common.css";
@import "../assets/door.css";
</style>
