<template>
  <div class="card-scene">
    <!-- <b-button v-b-modal.modal-xl>Launch demo modal</b-button> -->
    <div v-if="loading_status">
      <b-button variant="primary" disabled>
        <b-spinner small type="grow"></b-spinner>Loading...
      </b-button>
    </div>
    <Container
      v-else
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
          <b-input-group prepend class="mt-3">
            <b-form-input placeholder="Commit Message"></b-form-input>
            <b-input-group-append>
              <b-button variant="outline-success">
                <v-icon name="check"/>
              </b-button>
              <b-button variant="info">
                <v-icon name="eraser"/>
              </b-button>
            </b-input-group-append>
          </b-input-group>
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
                @dblclick="showDiffWithJSModal(card.abs_path)"
              >
                <p class="no-select">{{ card.data }}</p>
              </div>
            </Draggable>
          </Container>
        </div>
      </Draggable>
    </Container>
    <!-- <vodal
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

    </vodal>-->
    <modal name="diffview" :width="1000" :height="800" transition="nice-modal-fade">
      <div>
        <div slot="top-left">
          <button @click="hide()">x</button>
        </div>
      </div>
      <div v-if="loading_diff">
        <b-spinner variant="success" label="Spinning"></b-spinner>
      </div>
      <MonacoEditor
        v-else
        theme="vs-light"
        language="javascript"
        :options="options"
        :diffEditor="true"
        :original="code_left"
        :value="code_right"
      ></MonacoEditor>
    </modal>
  </div>
</template>

<script>
import { Container, Draggable } from "vue-smooth-dnd";
import { applyDrag, generateItems } from "./utils/helpers";
import { analyzeStatus } from "./utils/gitutils";
import MonacoEditor from "monaco-editor-vue";
const fs = require("fs");

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
      loading_status: true,
      showVodal: false,
      animation: "",
      modalHeader: "",

      // diff editor options
      options: {
        // selectOnLineNumbers: true
      },

      // diff view contents
      loading_diff: true,
      code_left: "",
      code_right: ""
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

    // provide two ways to show diff view modal
    showDiffWithVodal(data) {
      this.animation = "door";
      this.showVodal = true;
      this.modalHeader = data;
    },

    showDiffWithJSModal(abs_path) {
      this.$modal.show("diffview");
      this.loading_diff = true;
      fs.readFile(abs_path, "utf-8", (err, data) => {
        if (err) {
          alert("An error ocurred reading the file :" + err.message);
          return;
        }
        this.code_left = data;
        this.code_right = data;
        this.loading_diff = false;
      });
    },
    hide() {
      this.$modal.hide("diffview");
    },

    analyzeGitRepo() {
      console.log("Analyzing git repo...");
      analyzeStatus("")
        .then(res => {
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
                data: res.nodes[j].path,
                abs_path: res.nodes[j].abs_path
              }))
            }))
          };
          this.loading_status = false;
        })
        .catch(err => {
          this.loading_status = false;
          console.log(err);
        });
    }
  },
  created() {
    this.analyzeGitRepo();
  }
};
</script>

<style>
@import "../assets/common.css";
@import "../assets/door.css";
</style>
