 eslint-disable no-console */

<template>
  <div class="card-scene">
    <div v-if="loading_status">
      <b-button disabled variant="primary">
        <b-spinner small type="grow"></b-spinner>Loading...
      </b-button>
    </div>
    <Container
      :drop-placeholder="upperDropPlaceholderOptions"
      @drop="onColumnDrop($event)"
      drag-handle-selector=".column-drag-handle"
      orientation="horizontal"
      v-else
    >
      <Draggable :key="column.id" v-for="column in scene.children">
        <div :class="column.props.className">
          <div class="card-column-header">
            <span class="column-drag-handle" title="Drag to Move" v-b-tooltip.hover>
              <v-icon name="hand-spock" />
            </span>
            {{ column.name }}
          </div>
          <div id="message-container">
            <b-input-group :id="`message-${column.id}`" class="mt-3" prepend>
              <b-form-input placeholder="Commit Message" v-model="column.message"></b-form-input>
              <b-popover
                :target="`message-${column.id}`"
                @hidden="onHidden"
                @show="onShow"
                @shown="onShown"
                container="message-container"
                placement="auto"
                ref="popover"
                triggers="focus"
              >
                <template slot="title">
                  <!-- <b-button @click="onClose" aria-label="Close" class="close">
                    <span aria-hidden="true" class="d-inline-block">&times;</span>
                  </b-button>-->
                  Recommended Words
                </template>
              </b-popover>
              <b-input-group-append>
                <!-- disable button if the message is empty with: :disabled="!column.message" -->
                <b-button
                  @click="readyToCommit(column.message, column.children)"
                  title="Ok"
                  v-b-tooltip.hover
                  variant="outline-success"
                >
                  <v-icon name="check" />
                </b-button>
                <b-button @click="column.message=''" title="Clear" v-b-tooltip.hover variant="info">
                  <v-icon name="eraser" />
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </div>

          <Container
            :drop-placeholder="dropPlaceholderOptions"
            :get-child-payload="getCardPayload(column.id)"
            @drop="(e) => onCardDrop(column.id, e)"
            drag-class="card-ghost"
            drop-class="card-ghost-drop"
            group-name="col"
          >
            <Draggable
              :key="card.id"
              title="Drag to Move"
              v-b-tooltip.hover
              v-for="card in column.children"
            >
              <!-- <b-tooltip :target="() => $refs['card']" placement="bottom">Drag to Move</b-tooltip> -->
              <div
                :class="card.props.className"
                :style="card.props.style"
                @dblclick="showDiffWithSweet(card.abs_path, card.language)"
                class="no-select"
              >
                <p class="no-select" title="Double Click to Show Diff" v-b-tooltip.hover>
                  {{ card.path }}
                  <b-badge :variant="card.badgeType" pill>{{card.operation}}</b-badge>
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
          <b-list-group-item :key="file.id" v-for="file in commitFiles">{{file.path}}</b-list-group-item>
        </b-list-group>
      </b-card>
      <b-button @click="reallyCommit()" class="right-button" variant="success">Commit!</b-button>
      <b-button @click="cancelCommit()" class="right-button" variant="outline-primary">Cancel</b-button>
    </sweet-modal>

    <sweet-modal icon="success" ref="success" title="Success">{{successMessage}}</sweet-modal>
    <sweet-modal icon="warning" ref="alert" title="Alert">{{alertMessage}}</sweet-modal>
    <sweet-modal icon="error" ref="error" title="Error">{{errorMessage}}</sweet-modal>

    <!-- dialog to show diff -->
    <!-- sweet-modal-vue -->
    <sweet-modal :title="diffViewTitle" ref="diffViewModal" width="80%">
      <!-- <div v-if="loadingDiff">
        <b-spinner variant="success" label="Spinning"></b-spinner>
      </div>-->
      <!-- vue-monaco -->
      <MonacoEditor
        :diffEditor="true"
        :original="code_right"
        :value="code_left"
        class="editor"
        ref="diffViewEditor"
      />
    </sweet-modal>
    <!-- vodal -->
    <vodal
      :duration="301"
      :height="50"
      :show="showVodal"
      :width="80"
      @hide="showVodal = false"
      animation="door"
      class="my-dialog"
      measure="em"
    >
      <div class="header">{{diffViewTitle}}</div>
      <div v-if="loadingDiff">
        <b-spinner label="Spinning" variant="success"></b-spinner>
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
    <modal :height="800" :width="1000" name="diffViewJSModal" transition="nice-modal-fade">
      <div>
        <div slot="top-left">
          <button @click="hide()">x</button>
        </div>
      </div>
      <div v-if="loadingDiff">
        <b-spinner label="Spinning" variant="success"></b-spinner>
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
import { Container, Draggable } from 'vue-smooth-dnd'
import { applyDrag, generateItems } from './utils/helpers'
import { analyzeStatus, doCommit } from './utils/gitutils'
import { SweetModal } from 'sweet-modal-vue'

// import MonacoEditor from "monaco-editor-vue";
import MonacoEditor from 'vue-monaco'
const fs = require('fs')
const monaco = require('monaco-editor')

const columnNames = ['Lorem', 'Ipsum', 'Consectetur', 'Eiusmod']
const badgeTypeMap = new Map([
  ['Modified', 'primary'],
  ['Untracked', 'success'],
  ['Conflicted', 'danger'],
  ['Deleted', 'secondary'],
  ['Renamed', 'info']
])

const cardColors = [
  'azure',
  'beige',
  'bisque',
  'blanchedalmond',
  'burlywood',
  'cornsilk',
  'gainsboro',
  'ghostwhite',
  'ivory',
  'khaki'
]

const pickColor = () => {
  const rand = Math.floor(Math.random() * 10)
  return cardColors[rand]
}

var scene = {
  type: 'container',
  props: {
    orientation: 'horizontal'
  },
  children: []
}

export default {
  name: 'Cards',

  components: { Container, Draggable, MonacoEditor, SweetModal },

  data() {
    return {
      scene,
      upperDropPlaceholderOptions: {
        className: 'cards-drop-preview',
        animationDuration: '150',
        showOnTop: true
      },
      dropPlaceholderOptions: {
        className: 'drop-preview',
        animationDuration: '150',
        showOnTop: true
      },
      // async analyzing git repo
      loading_status: true,
      successMessage: '',
      alertMessage: '',
      errorMessage: '',

      // diff editor options
      options: {
        // selectOnLineNumbers: true
        // language: "json"
      },

      // diff view contents
      diffViewTitle: '',
      showVodal: false, // only for vodal
      loadingDiff: true,
      language: '',
      code_left: '',
      code_right: '',

      // commit data
      commitMessage: '',
      commitFiles: []
    }
  },

  methods: {
    // handle drag&drop
    onColumnDrop(dropResult) {
      const scene = Object.assign({}, this.scene)
      scene.children = applyDrag(scene.children, dropResult)
      this.scene = scene
    },

    onCardDrop(columnId, dropResult) {
      if (dropResult.removedIndex !== null || dropResult.addedIndex !== null) {
        const scene = Object.assign({}, this.scene)
        const column = scene.children.filter(p => p.id === columnId)[0]
        const columnIndex = scene.children.indexOf(column)

        const newColumn = Object.assign({}, column)
        newColumn.children = applyDrag(newColumn.children, dropResult)
        scene.children.splice(columnIndex, 1, newColumn)

        this.scene = scene
      }
    },

    getCardPayload(columnId) {
      return index => {
        return this.scene.children.filter(p => p.id === columnId)[0].children[
          index
        ]
      }
    },

    // methods for commit message tags popover
    onClose() {
      // this.$refs.popover.$emit('close')
      // this.popoverShow = false
    },
    onOk() {},
    onShow() {
      // This is called just before the popover is shown
      // Reset our popover form variables
    },
    onShown() {
      // Called just after the popover has been shown
      // Transfer focus to the first input
    },
    onHidden() {
      // Called just after the popover has finished hiding
      // Bring focus back to the button
    },
    focusRef(ref) {
      // Some references may be a component, functional component, or plain element
      // This handles that check before focusing, assuming a `focus()` method exists
      // We do this in a double `$nextTick()` to ensure components have
      // updated & popover positioned first
      this.$nextTick(() => {
        this.$nextTick(() => {
          // ;(ref.$el || ref).focus()
        })
      })
    },

    log(...params) {
      console.log(...params)
    },

    getBadgeType(operation) {
      return badgeTypeMap.get(operation)
    },

    //  prepare data by analyzing git repo
    analyzeGitRepo() {
      // console.log("Analyzing git repo "+ __dirname);
      analyzeStatus('')
        .then(res => {
          console.log(res)
          this.scene = {
            type: 'container',
            props: {
              orientation: 'horizontal'
            },
            children: generateItems(4, i => ({
              id: `column${i}`,
              type: 'container',
              name: columnNames[i],
              props: {
                orientation: 'vertical',
                className: 'card-container'
              },
              message: '',
              children: generateItems(res.nodes.length, j => ({
                type: 'draggable',
                id: `${i}${j}`,
                props: {
                  className: 'card',
                  style: { backgroundColor: pickColor() }
                },
                operation: res.nodes[j].operation,
                badgeType: this.getBadgeType(res.nodes[j].operation),
                path: res.nodes[j].path,
                abs_path: res.nodes[j].abs_path,
                language: res.nodes[j].lang
              }))
            }))
          }
          this.loading_status = false
          console.log(this.scene)
        })
        .catch(err => {
          this.loading_status = false
          this.errorMessage = err.message
          this.$refs.error.open()
        })
    },

    // show diffs with alternative modal
    showDiffWithSweet(abs_path, language) {
      this.$refs.diffViewModal.open()
      this.loadingDiff = true
      this.diffViewTitle = abs_path
      fs.readFile(abs_path, 'utf-8', (err, data) => {
        if (err) {
          this.errorMessage =
            'An error ocurred reading the file :' + err.message
          this.$refs.error.open()
          return
        }
        // this.language = language;
        this.loadingDiff = false
        monaco.editor.setModelLanguage(
          this.$refs.diffViewEditor.getModifiedEditor().getModel(),
          language
        )
        this.code_left = data
        this.code_right = data
      })
    },

    showDiffWithVodal(abs_path, language) {
      this.showVodal = true
      this.loadingDiff = true
      this.diffViewTitle = abs_path
      fs.readFile(abs_path, 'utf-8', (err, data) => {
        if (err) {
          this.errorMessage =
            'An error ocurred reading the file :' + err.message
          this.$refs.error.open()
          return
        }
        this.language = language
        this.code_left = data
        this.code_right = data
        this.loadingDiff = false
      })
    },

    showDiffWithJSModal(abs_path, language) {
      this.$modal.show('diffViewJSModal')
      this.loadingDiff = true
      fs.readFile(abs_path, 'utf-8', (err, data) => {
        if (err) {
          this.errorMessage =
            'An error ocurred reading the file :' + err.message
          this.$refs.error.open()
          return
        }
        this.language = language
        this.code_left = data
        this.code_right = data
        this.loadingDiff = false
      })
    },
    hide() {
      this.$modal.hide('diffViewJSModal')
    },

    // handle commit action
    readyToCommit(message, list) {
      if (list.length == 0) {
        this.alertMessage = 'No files to commit in this group!'
        this.$refs.alert.open()
      } else if (message === '') {
        this.alertMessage = 'The commit message cannot be empty!'
        this.$refs.alert.open()
      } else {
        this.commitMessage = message
        this.commitFiles = list
        this.$refs.commitModal.open()
      }
    },
    reallyCommit() {
      let filePaths = new Array()
      console.log(this.commitFiles)
      for (let file of this.commitFiles) {
        console.log(file)
        filePaths.push(file.path)
      }
      doCommit('', this.commitMessage, filePaths)
        .then(res => {
          this.successMessage =
            'Successfully commit ' + res.commit + 'to branch ' + res.branch
          this.$refs.commitModal.close()
          this.$refs.successModal.open()
        })
        .catch(err => {
          this.errorMessage = err
          this.$refs.error.open()
        })
    },
    cancelCommit() {
      this.$refs.commitModal.close()
    }
  },

  created() {
    this.analyzeGitRepo()
  }
}
</script>

<style>
@import '../assets/common.css';
@import '../assets/slide-down.css';
@import '../assets/door.css';

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
