/* eslint-disable no-console */

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
            <b-form-input placeholder="Commit Message" v-model="column.message"></b-form-input>
            <b-input-group-append>
              <!-- disable button if the message is empty with: :disabled="!column.message" -->
              <b-button
                variant="outline-success"
                v-b-tooltip.hover
                title="Ok"
                @click="readyToCommit(column.message, column.children)"
              >
                <v-icon name="check"/>
              </b-button>
              <b-button variant="info" v-b-tooltip.hover title="Clear" @click="column.message=''">
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
                @dblclick="showDiffWithSweet(card.abs_path, card.language)"
              >
                <p class="no-select" v-b-tooltip.hover title="Double Click to Show Diff">
                  {{ card.path }}
                  <b-badge pill :variant="card.badgeType">{{card.operation}}</b-badge>
                </p>
              </div>
            </Draggable>
          </Container>
        </div>
      </Draggable>
    </Container>

    <!-- dialog to confirm commit -->
    <sweet-modal ref="commitModal" title="Ready to Commit?">
      <b-card :header="commitMessage" border-variant="success">
        <b-list-group>
          <b-list-group-item v-for="file in commitFiles" :key="file.id">{{file.path}}</b-list-group-item>
        </b-list-group>
      </b-card>
      <b-button class="right-button" variant="success" @click="reallyCommit()">Commit!</b-button>
      <b-button class="right-button" variant="outline-primary" @click="cancelCommit()">Cancel</b-button>
    </sweet-modal>

    <sweet-modal ref="success" title="Success" icon="success">{{successMessage}}</sweet-modal>
    <sweet-modal ref="alert" title="Alert" icon="warning">{{alertMessage}}</sweet-modal>
    <sweet-modal ref="error" title="Error" icon="error">{{errorMessage}}</sweet-modal>

    <!-- dialog to show diff -->
    <!-- sweet-modal-vue -->
    <sweet-modal ref="diffViewModal" :title="diffViewTitle" width="80%">
      <!-- <div v-if="loadingDiff">
        <b-spinner variant="success" label="Spinning"></b-spinner>
      </div>-->
      <!-- vue-monaco -->
      <MonacoEditor
        ref="diffViewEditor"
        class="editor"
        :value="code_left"
        :original="code_right"
        :diffEditor="true"
      />
    </sweet-modal>
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
      <div class="header">{{diffViewTitle}}</div>
      <div v-if="loadingDiff">
        <b-spinner variant="success" label="Spinning"></b-spinner>
      </div>
      <!-- monaco-editor-vue -->
      <!-- <MonacoEditor
        v-else
        theme="vs-light"
        :language="language"
        :options="options"
        :diffEditor="true"
        :original="code_left"
        :value="code_right"
      ></MonacoEditor>-->
    </vodal>

    <!-- vue-js-modal -->
    <modal name="diffViewJSModal" :width="1000" :height="800" transition="nice-modal-fade">
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
import { analyzeStatus, doCommit } from "./utils/gitutils";
import { SweetModal } from "sweet-modal-vue";

// import MonacoEditor from "monaco-editor-vue";
import MonacoEditor from "vue-monaco";
const fs = require("fs");
const monaco = require("monaco-editor");

const columnNames = ["Lorem", "Ipsum", "Consectetur", "Eiusmod"];
const badgeTypeMap = new Map([
  ["Modified", "primary"],
  ["Untracked", "success"],
  ["Conflicted", "danger"],
  ["Deleted", "secondary"],
  ["Renamed", "info"]
]);

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

  components: { Container, Draggable, MonacoEditor, SweetModal },

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
      successMessage: "",
      alertMessage: "",
      errorMessage: "",

      // diff editor options
      options: {
        // selectOnLineNumbers: true
        // language: "json"
      },

      // diff view contents
      diffViewTitle: "",
      showVodal: false, // only for vodal
      loadingDiff: true,
      language: "",
      code_left: "",
      code_right: "",

      // commit data
      commitMessage: "",
      commitFiles: []
    };
  },

  methods: {
    // handle drag&drop
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

    getBadgeType(operation) {
      return badgeTypeMap.get(operation);
    },

    //  prepare data by analyzing git repo
    analyzeGitRepo() {
      // console.log("Analyzing git repo "+ __dirname);
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
              message: "",
              children: generateItems(res.nodes.length, j => ({
                type: "draggable",
                id: `${i}${j}`,
                props: {
                  className: "card",
                  style: { backgroundColor: pickColor() }
                },
                operation: res.nodes[j].operation,
                badgeType: this.getBadgeType(res.nodes[j].operation),
                path: res.nodes[j].path,
                abs_path: res.nodes[j].abs_path,
                language: res.nodes[j].lang
              }))
            }))
          };
          this.loading_status = false;
          console.log(this.scene);
        })
        .catch(err => {
          this.loading_status = false;
          this.errorMessage = err.message;
          this.$refs.error.open();
        });
    },

    // show diffs with alternative modal
    showDiffWithSweet(abs_path, language) {
      this.$refs.diffViewModal.open();
      this.loadingDiff = true;
      this.diffViewTitle = abs_path;
      fs.readFile(abs_path, "utf-8", (err, data) => {
        if (err) {
          this.errorMessage =
            "An error ocurred reading the file :" + err.message;
          this.$refs.error.open();
          return;
        }
        // this.language = language;
        this.loadingDiff = false;
        monaco.editor.setModelLanguage(
          this.$refs.diffViewEditor.getModifiedEditor().getModel(),
          language
        );
        this.code_left = data;
        this.code_right = data;
      });
    },

    showDiffWithVodal(abs_path, language) {
      this.showVodal = true;
      this.loadingDiff = true;
      this.diffViewTitle = abs_path;
      fs.readFile(abs_path, "utf-8", (err, data) => {
        if (err) {
          this.errorMessage =
            "An error ocurred reading the file :" + err.message;
          this.$refs.error.open();
          return;
        }
        this.language = language;
        this.code_left = data;
        this.code_right = data;
        this.loadingDiff = false;
      });
    },

    showDiffWithJSModal(abs_path, language) {
      this.$modal.show("diffViewJSModal");
      this.loadingDiff = true;
      fs.readFile(abs_path, "utf-8", (err, data) => {
        if (err) {
          this.errorMessage =
            "An error ocurred reading the file :" + err.message;
          this.$refs.error.open();
          return;
        }
        this.language = language;
        this.code_left = data;
        this.code_right = data;
        this.loadingDiff = false;
      });
    },
    hide() {
      this.$modal.hide("diffViewJSModal");
    },

    // handle commit action
    readyToCommit(message, list) {
      if (list.length == 0) {
        this.alertMessage = "No files to commit in this group!";
        this.$refs.alert.open();
      } else if (message === "") {
        this.alertMessage = "The commit message cannot be empty!";
        this.$refs.alert.open();
      } else {
        this.commitMessage = message;
        this.commitFiles = list;
        this.$refs.commitModal.open();
      }
    },
    reallyCommit() {
      let filePaths = new Array();
      console.log(this.commitFiles);
      for (let file of this.commitFiles) {
        console.log(file);
        filePaths.push(file.path);
      }
      doCommit("", this.commitMessage, filePaths)
        .then(res => {
          this.successMessage =
            "Successfully commit " + res.commit + "to branch " + res.branch;
          this.$refs.commitModal.close();
          this.$refs.successModal.open();
        })
        .catch(err => {
          this.errorMessage = err;
          this.$refs.error.open();
        });
    },
    cancelCommit() {
      this.$refs.commitModal.close();
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

.editor {
  height: 800px;
}

.sweet-modal .sweet-title h2 {
  line-height: inherit;
}

.right-button {
  float: right;
  margin-top: 10px;
  margin-right: 10px;
}
</style>
