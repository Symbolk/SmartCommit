<template>
  <div class="card-scene">
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
      :drop-placeholder="upperDropPlaceholderOptions"
    >
      <Draggable v-for="column in scene.children" :key="column.id">
        <div :class="column.props.className">
          <div class="card-column-header">
            <span class="column-drag-handle" v-b-tooltip.hover title="Drag to Move">
              <v-icon name="hand-spock"/>
            </span>
            {{ column.name }}
          </div>
          <b-input-group prepend class="mt-3">
            <b-form-input placeholder="Commit Message"></b-form-input>
            <b-input-group-append>
              <b-button variant="outline-success" v-b-tooltip.hover title="Ok">
                <v-icon name="check"/>
              </b-button>
              <b-button variant="info" v-b-tooltip.hover title="Clear">
                <v-icon name="eraser"/>
              </b-button>
            </b-input-group-append>
          </b-input-group>
          <Container
            group-name="col"
            @drop="(e) => onCardDrop(column.id, e)"
            :get-child-payload="getCardPayload(column.id)"
            drag-class="card-ghost"
            drop-class="card-ghost-drop"
            :drop-placeholder="dropPlaceholderOptions"
          >
            <Draggable
              v-for="card in column.children"
              :key="card.id"
              v-b-tooltip.hover
              title="Drag to Move"
            >
              <!-- <b-tooltip :target="() => $refs['card']" placement="bottom">Drag to Move</b-tooltip> -->
              <div
                :class="card.props.className"
                :style="card.props.style"
                class="no-select"
                @dblclick="showDiffWithVodal(card.abs_path, card.language)"
              >
                <p
                  class="no-select"
                  v-b-tooltip.hover
                  title="Double Click to Show Diff"
                >{{ card.data }}</p>
              </div>
            </Draggable>
          </Container>
        </div>
      </Draggable>
    </Container>
    <!-- vodal -->
    <vodal
      measure="em"
      :show="showVodal"
      animation="door"
      :width="80"
      :height="50"
      :duration="301"
      class="my-dialog"
      @hide="showVodal = false"
    >
      <div class="header">{{diffTitle}}</div>
      <div v-if="loadingDiff">
        <b-spinner variant="success" label="Spinning"></b-spinner>
      </div>
      <!-- vue-monaco -->
      <!-- <MonacoEditor
        class="editor"
        :value="code_left"
        :original="code_right"
        :diffEditor="true"
        :options="options"
        :language="language"
      />-->
      <!-- monaco-editor-vue -->
      <MonacoEditor
        v-else
        theme="vs-light"
        :language="language"
        :options="options"
        :diffEditor="true"
        :original="code_left"
        :value="code_right"
      ></MonacoEditor>
    </vodal>

    <!-- vue-js-modal -->
    <modal name="diffview" :width="1000" :height="800" transition="nice-modal-fade">
      <div>
        <div slot="top-left">
          <button @click="hide()">x</button>
        </div>
      </div>
      <div v-if="loadingDiff">
        <b-spinner variant="success" label="Spinning"></b-spinner>
      </div>
      <!-- <MonacoEditor
        v-else
        theme="vs-light"
        :language="language"
        :options="options"
        :diffEditor="true"
        :original="code_left"
        :value="code_right"
      ></MonacoEditor>-->
    </modal>
  </div>
</template>

<script>
import { Container, Draggable } from "vue-smooth-dnd";
import { applyDrag, generateItems } from "./utils/helpers";
import { analyzeStatus } from "./utils/gitutils";
import MonacoEditor from "monaco-editor-vue";
// import MonacoEditor from "vue-monaco";
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

      // diff editor options
      options: {
        // selectOnLineNumbers: true
        // language: "json"
      },

      // diff view contents
      diffTitle: "",
      showVodal: false, // only for vodal
      loadingDiff: true,
      language: "",
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

    log(...params) {
      console.log(...params);
    },

    // provide two ways to show diff view modal
    showDiffWithVodal(abs_path, language) {
      this.showVodal = true;
      this.loadingDiff = true;
      this.diffTitle = abs_path;
      fs.readFile(abs_path, "utf-8", (err, data) => {
        if (err) {
          alert("An error ocurred reading the file :" + err.message);
          return;
        }
        this.language = language;
        this.code_left = data;
        this.code_right = data;
        this.loadingDiff = false;
      });
    },

    showDiffWithJSModal(abs_path, language) {
      this.$modal.show("diffview");
      this.loadingDiff = true;
      fs.readFile(abs_path, "utf-8", (err, data) => {
        if (err) {
          alert("An error ocurred reading the file :" + err.message);
          return;
        }
        this.language = language;
        this.code_left = data;
        this.code_right = data;
        this.loadingDiff = false;
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
                abs_path: res.nodes[j].abs_path,
                language: res.nodes[j].lang
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
@import "../assets/slide-down.css";
@import "../assets/door.css";

.no-select {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.column-drag-handle:hover {
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
}

.no-select:hover {
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
}

.no-select:active {
  cursor: grabbing;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
}
</style>
