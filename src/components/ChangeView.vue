<template>
  <div>
    <sweet-modal icon="success" ref="successModal" title="Success">{{successMsg}}</sweet-modal>
    <sweet-modal icon="warning" ref="alertModal" title="Alert">{{alertMsg}}</sweet-modal>
    <sweet-modal icon="error" ref="errorModal" title="Error">{{errorMsg}}</sweet-modal>

    <sweet-modal
      blocking
      hide-close-button
      icon="info"
      modal-theme="light"
      overlay-theme="light"
      ref="analyzeModal"
      title="Analyzing changes ..."
    >
      <b-progress max="max">
        <b-progress-bar
          :label="`${((progress / max) * 100).toFixed(2)}%`"
          :value="progress"
          animated
          striped
          variant="success"
        ></b-progress-bar>
      </b-progress>
      <br />
      <div>
        <b-button @click="analyze()" variant="success">Start Analyzing</b-button>
      </div>
    </sweet-modal>

    <!-- <b-container fluid> -->
    <b-row align-v="start" class="group-view" no-gutters>
      <b-col>
        <div class="card-scene">
          <vue-scroll :ops="horizonScrollOps">
            <Container
              :drop-placeholder="upperDropPlaceholderOptions"
              @drag-start="dragStart"
              @drop="onColumnDrop($event)"
              drag-handle-selector=".column-drag-handle"
              orientation="horizontal"
            >
              <Draggable :key="column.id" v-for="column in scene.children">
                <div :class="column.props.className">
                  <div class="card-column-header">
                    <span class="column-drag-handle">&#x2630;</span>
                    <span class="column-drag-handle" title="Drag to Move" v-b-tooltip.hover>
                      <b-icon icon="document-diff" scale="1.0"></b-icon>
                    </span>
                    {{ column.group_label }}
                  </div>
                  <div id="message-container">
                    <b-input-group :id="`message-${column.id}`" class="mt-3" prepend>
                      <!-- <b-form-input placeholder="Commit Message" v-model="column.message"></b-form-input> -->
                      <b-form-textarea
                        max-rows="10"
                        placeholder="Commit Message"
                        rows="2"
                        v-model="column.commit_msg"
                      ></b-form-textarea>
                      <b-input-group-append>
                        <b-button
                          :disabled="!column.commit_msg"
                          :variant="column.variant"
                          @click="column.variant='success'"
                          title="Ready to Commit"
                          v-b-tooltip.hover
                        >
                          <v-icon name="check" />
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </div>
                  <vue-scroll :ops="verticalScrollOps">
                    <div class="card-scroll-area">
                      <Container
                        :drop-placeholder="dropPlaceholderOptions"
                        :get-child-payload="getCardPayload(column.id)"
                        @drag-end="(e) => log()"
                        @drag-start="(e) => log()"
                        @drop="(e) => onCardDrop(column.id, e)"
                        drag-class="card-ghost"
                        drop-class="card-ghost-drop"
                        group-name="col"
                      >
                        <Draggable :key="card.id" v-for="card in column.children">
                          <div
                            :class="card.props.className"
                            :style="card.props.style"
                            @click="showDiff(card.a_hunk, card.b_hunk, card.description)"
                            class="no-select"
                            title="Click to Show Diff & Drag to Move"
                            v-b-tooltip.hover
                          >
                            <p>
                              {{ card.a_hunk.relativeFilePath }}:{{card.a_hunk.startLine}}-{{card.a_hunk.endLine}}
                              <b-badge pill style="float:right">Old</b-badge>
                            </p>
                            <p>
                              {{ card.b_hunk.relativeFilePath }}:{{card.b_hunk.startLine}}-{{card.b_hunk.endLine}}
                              <b-badge pill style="float:right" variant="success">New</b-badge>
                            </p>
                          </div>
                        </Draggable>
                      </Container>
                    </div>
                  </vue-scroll>
                </div>
              </Draggable>
              <b-button @click="appendNewGroup" variant="outputline-success">+ New Group</b-button>
            </Container>
          </vue-scroll>
        </div>
      </b-col>
    </b-row>
    <!-- </b-container> -->

    <b-row no-gutters>
      <b-col>
        <h6>
          {{pathLeft}}:{{startLineLeft}}-{{endLineLeft}}
          <b-badge>Old</b-badge>
        </h6>
      </b-col>
      <b-col>
        <h6>
          {{pathRight}}:{{startLineRight}}-{{endLineRight}}
          <b-badge variant="success">New</b-badge>
        </h6>
      </b-col>
    </b-row>

    <b-row align-v="center" no-gutters>
      <b-col class="diff-view">
        <MonacoEditor
          :diffEditor="true"
          :language="language"
          :options="sideOptions"
          :original="codeLeft"
          :value="codeRight"
          class="editor"
          ref="diffEditor"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { SweetModal } from 'sweet-modal-vue'
import { Container, Draggable } from 'vue-smooth-dnd'
import MonacoEditor from './vue-monaco'
import { checkIsRepo, getRootPath } from './utils/gitutils'
import { isPathValid, invokeAnalysis, getFileName } from './utils/fsutils'
import { applyDrag, generateItems } from './utils/helpers'

const loadJsonFile = require('load-json-file')
const fs = require('fs')
const path = require('path')

const scene = {
  type: 'container',
  props: {
    orientation: 'horizontal'
  },
  children: []
}

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

const pickColor = fileIndex => {
  if (fileIndex < cardColors.length) {
    return cardColors[fileIndex]
  } else {
    let index = fileIndex % cardColors.length
    return cardColors[index]
  }
}

export default {
  name: 'ChangeView',
  components: {
    Container,
    Draggable,
    SweetModal,
    MonacoEditor
  },
  data() {
    return {
      // repo data
      REPO_PATH: '',
      REPO_NAME: '',
      DATA_PATH: '',

      // analyze with jar
      progress: 0,
      max: 100,

      // code related data
      language: 'java',
      pathLeft: 'Double Click a Card to View Diff',
      pathRight: 'Double Click a Card to View Diff',
      startLineLeft: '',
      endLineLeft: ')',
      startLineRight: '',
      endLineRight: ')',
      codeLeft: 'Old Content',
      codeRight: 'New Content',
      // diff editor options
      sideOptions: {
        selectOnLineNumbers: true,
        readOnly: true,
        renderSideBySide: true,
        glyphMargin: true,
        // rulers: [1, 2, 3],
        // ignoreTrimWhitespace: false,
        // smoothScrolling: true
        renderFinalNewline: false
      },
      horizonScrollOps: {
        // vuescroll: {
        //   wheelDirectionReverse: true,
        //   // keepShow: true,
        //   // mode: 'slide',
        //   // detectResize: false
        // }
      },
      verticalScrollOps: {
        bar: {
          keepShow: true
        }
      },

      // view data
      scene,
      upperDropPlaceholderOptions: {
        className: 'cards-drop-preview',
        animationDuration: '100',
        showOnTop: true
      },
      dropPlaceholderOptions: {
        className: 'drop-preview',
        animationDuration: '100',
        showOnTop: true
      },

      barValue: 0,

      // statistics
      steps: 0,
      actions: [], // the list of moving actions of the user
      // temp id to compute actions
      fromCard: 'null:null',
      toCard: 'null:null',

      // prompt messages
      successMsg: '',
      alertMsg: '',
      errorMsg: ''
    }
  },
  methods: {
    analyze() {
      // invoke jar to analyze the current repo
      this.progress = 50
      invokeAnalysis('/Users/symbolk/coding/data/repos/IntelliMerge')
        .then(output => {
          console.log(output)
          // return data path
          this.DATA_PATH = output
          console.log('Data path: ' + this.DATA_PATH)
          // update the progress

          // load data
          this.loadMetaData()
          // this.successMsg = 'Finish analyzing repo.'
          // this.$refs.successModal.open()
          this.$refs.analyzeModal.close()
        })
        .catch(err => {
          this.alertMsg = err
          console.log(err)
          this.$refs.alertModal.open()
          this.$refs.analyzeModal.close()
        })
    },
    // Data loading
    loadMetaData() {
      // load and extract data into list of json
      let groupsDir = this.DATA_PATH + '/generated_groups'
      let groups = []
      fs.readdirSync(groupsDir).forEach(filename => {
        const name = path.parse(filename).name.replace(/(.*).json/, '')
        const content = loadJsonFile.sync(path.resolve(groupsDir, filename))
        groups.push({
          name: name,
          content: content
        })
      })
      let diffsDir = this.DATA_PATH + '/diffs'
      let diffs = {}
      fs.readdirSync(diffsDir).forEach(filename => {
        const name = path.parse(filename).name.replace(/(.*).json/, '')
        const content = loadJsonFile.sync(path.resolve(diffsDir, filename))
        diffs[name] = content
      })

      // match diff hunks info
      for (let group of groups) {
        let diff_hunks = []
        for (let id of group.content.diffHunkIDs) {
          let idPair = String(id).split(':')
          if (idPair.length == 2) {
            diff_hunks.push(
              diffs[String(idPair[0])].diffHunksMap[String(idPair[1])]
            )
          }
        }
        group.diff_hunks = diff_hunks
      }

      // convert json into scene children
      this.scene = {
        type: 'container',
        props: {
          orientation: 'horizontal'
        },
        children: generateItems(groups.length, i => ({
          id: i,
          type: 'container',
          name: 'Group $i',
          props: {
            orientation: 'vertical',
            className: 'card-container'
          },
          group_id: groups[i].content.groupID,
          group_label: groups[i].content.intentLabel,
          commit_msg: groups[i].content.commitMsg,
          variant: 'outputline-success', // checked or not
          committed: false, // whether the group has been committed
          // diff hunks
          children: generateItems(groups[i].diff_hunks.length, j => ({
            type: 'draggable',
            id: `${i}${j}`,
            props: {
              className: 'card',
              style: {
                backgroundColor: pickColor(groups[i].diff_hunks[j].fileIndex)
              }
            },
            file_index: groups[i].diff_hunks[j].fileIndex,
            diff_hunk_index: groups[i].diff_hunks[j].index,
            change_type: groups[i].diff_hunks[j].changeType,
            description: groups[i].diff_hunks[j].description,
            a_hunk: groups[i].diff_hunks[j].baseHunk,
            b_hunk: groups[i].diff_hunks[j].currentHunk
          }))
        }))
      }
      // refresh to load data
    },

    showDiff(a_hunk, b_hunk, description) {
      this.pathLeft = a_hunk.relativeFilePath
      this.pathRight = b_hunk.relativeFilePath
      this.startLineLeft = a_hunk.startLine
      this.startLineRight = b_hunk.startLine
      this.endLineLeft = a_hunk.endLine
      this.endLineRight = b_hunk.endLine

      this.$bvToast.hide()
      this.$bvToast.toast(description, {
        title: 'Change Actions',
        toaster: 'b-toaster-bottom-center',
        solid: true,
        variant: 'success',
        // appendToast: false,
        noAutoHide: true
      })

      if (!isPathValid(this.pathLeft)) {
        this.codeLeft = ''
      } else {
        try {
          this.codeLeft = fs.readFileSync(
            this.DATA_PATH + '/base/' + this.pathLeft,
            'utf-8'
          )
        } catch (err) {
          this.errorMessage = this.pathLeft + ' :' + err.message
          this.$refs.errorModal.open()
          return
        }
      }

      if (!isPathValid(this.pathRight)) {
        this.codeRight = ''
      } else {
        try {
          this.codeRight = fs.readFileSync(
            this.DATA_PATH + '/current/' + this.pathRight,
            'utf-8'
          )
        } catch (err) {
          this.errorMessage = this.pathRight + ' :' + err.message
          this.$refs.errorModal.open()
          return
        }
      }

      const monaco = require('monaco-editor')
      var originalModel = monaco.editor.createModel(
        this.codeLeft,
        this.language
      )
      var modifiedModel = monaco.editor.createModel(
        this.codeRight,
        this.language
      )

      //  highlight the current focused area (not working for no reason)
      originalModel.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(this.startLineLeft, 0, this.endLineLeft, 0),
            options: {
              isWholeLine: true,
              linesDecorationsClassName: 'line-decoration',
              inlineClassName: 'line-decoration',
              className: 'line-decoration',
              marginClassName: 'line-decoration'
            }
          }
        ]
      )

      modifiedModel.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(
              this.startLineRight,
              0,
              this.endLineRight,
              0
            ),
            options: {
              isWholeLine: true,
              linesDecorationsClassName: 'line-decoration',
              className: 'line-decoration',
              marginClassName: 'line-decoration'
            }
          }
        ]
      )

      this.$refs.diffEditor.getEditor().setModel({
        original: originalModel,
        modified: modifiedModel
      })

      // this.$refs.diffEditor
      //   .getEditor()
      //   .revealRangeAtTop(
      //     new monaco.Range(leftStartLine, 1, leftEndLine, 1)
      //   )
      this.$refs.diffEditor
        .getEditor()
        .revealLinesInCenter(this.startLineLeft, this.endLineLeft)
      this.$refs.diffEditor
        .getModifiedEditor()
        .revealLinesInCenter(this.startLineRight, this.endLineRight)
    },

    // UI methods
    appendNewGroup() {
      const scene = Object.assign({}, this.scene)
      let newGroupID = this.scene.children.length
      scene.children.push({
        id: newGroupID,
        type: 'container',
        name: `Group ${newGroupID}`,
        props: {
          orientation: 'vertical',
          className: 'card-container'
        },
        group_id: 'group ${newGroupID}',
        group_label: 'NEW',
        commit_msg: '',
        committed: false,
        children: []
      })
      this.scene = scene
    },

    getCardPayload(columnId) {
      return index => {
        return this.scene.children.filter(p => p.id === columnId)[0].children[
          index
        ]
      }
    },
    onColumnDrop(dropResult) {
      const scene = Object.assign({}, this.scene)
      scene.children = applyDrag(scene.children, dropResult)
      this.scene = scene
      this.steps += 1
      let action =
        '[Group]' + dropResult.removedIndex + '->' + dropResult.addedIndex

      console.log(action)
      this.actions.push(action)
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
        // a trick to get the action
        if (this.containsNull(this.fromCard)) {
          this.fromCard = columnId + ':' + dropResult.removedIndex
        }
        if (this.containsNull(this.toCard)) {
          this.toCard = newColumn.id + ':' + dropResult.addedIndex
        }

        if (
          !this.containsNull(this.fromCard) &&
          !this.containsNull(this.toCard)
        ) {
          let action = '[Hunk]' + this.fromCard + '->' + this.toCard
          console.log(action)
          this.actions.push(action)
          this.fromCard = 'null:null'
          this.toCard = 'null:null'
        }
        // move to another column
        if (
          !(dropResult.removedIndex !== null && dropResult.addedIndex != null)
        ) {
          this.steps += 0.5
        }
      }
    },
    containsNull(str) {
      return str.indexOf('null') != -1
    },
    dragStart() {
      // console.log('drag started')
    },
    log() {}
  },
  mounted() {
    this.$refs.analyzeModal.open()
  },
  created() {
    checkIsRepo(this.REPO_PATH)
      .then(res => {
        if (res) {
          console.log('Loading data: ' + __dirname)
          getRootPath(this.REPO_PATH)
            .then(rootPath => {
              this.REPO_PATH = rootPath + '/'
              console.log('Repo root path: ' + this.REPO_PATH)
              this.REPO_NAME = getFileName(rootPath)
              console.log('Repo name: ' + this.REPO_NAME)
              // show the repo info in the navbar
              this.$root.$emit('showRepoName', this.REPO_NAME, '', '')
            })
            .catch(err => {
              this.loadingStatus = false
              console.log(err)
              this.errorMsg = err.message
              this.$refs.errorModal.open()
            })
        } else {
          this.$refs.usageModal.open()
        }
      })
      .catch(err => {
        this.alertMsg = err
        console.log(err)
        this.$refs.alertModal.open()
      })
  }
}
</script>

<style scoped>
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

p {
  margin: 0;
  font-size: 12px;
}

h6 {
  margin-left: 10px;
}

.no-select {
  -webkit-touch-calloutput: none;
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

.group-view {
  height: 52vh;
  margin-bottom: 5px;
}

.card-scroll-area {
  /* overflow: scroll; */
  height: 40vh;
  /* position: fixed; */
  /* z-index: 2; */
}

.diff-view {
  height: 38vh;
}

.editor {
  height: 100%;
}

.line-decoration {
  background: blueviolet;
  width: 50px !important;
  margin-left: 3px;
}
</style>