<template>
  <div>
    <sweet-modal icon="success" ref="successModal" title="Success">{{successMsg}}</sweet-modal>
    <sweet-modal icon="warning" ref="alertModal" title="Alert">{{alertMsg}}</sweet-modal>
    <sweet-modal icon="error" ref="errorModal" title="Error">{{errorMsg}}</sweet-modal>

    <b-row align-v="start" no-gutters>
      <b-col class="group-view">
        <div class="card-scene">
          <vue-scroll :ops="scrollOptions">
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
                      <b-icon icon="document-diff" scale="1.5"></b-icon>
                    </span>
                    {{ column.group_label }}
                  </div>
                  <div class="card-scroll-area">
                    <vue-scroll>
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
                              {{ card.a_hunk.git_path }}:{{card.a_hunk.start_line}}-{{card.a_hunk.end_line}}
                              <b-badge pill style="float:right">Old</b-badge>
                            </p>
                            <p>
                              {{ card.b_hunk.git_path }}:{{card.b_hunk.start_line}}-{{card.b_hunk.end_line}}
                              <b-badge pill style="float:right" variant="success">New</b-badge>
                            </p>
                          </div>
                        </Draggable>
                      </Container>
                    </vue-scroll>
                  </div>
                </div>
              </Draggable>
              <b-button @click="appendNewGroup" variant="outline-success">+ New Group</b-button>
            </Container>
          </vue-scroll>
        </div>
      </b-col>
    </b-row>

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
import {
  checkIsRepo,
  getFileName,
  getRootPath,
  analyzeStatus,
  doCommit,
  doPush,
  showAtHEAD
} from './utils/gitutils'

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

      scrollOptions: {
        wheelDirectionReverse: true
        // keepShow: true
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
      // prompt messages
      successMsg: '',
      alertMsg: '',
      errorMsg: ''
    }
  },
  methods: {
    // Data loading
    loadMetaData() {
      // show the repo info in the navbar/
      let dataDir =
        require('os').homedir() + '/.mergebot/repos/SmartCommitCore_mergebot/smart_commit'
      console.log('Data path: ' + dataDir)
      // load data files into list of json
      let groupsDir = dataDir + '/generated_groups'
      //   let diffsDir = dataDir + '/diffs'
      let groups = []
      fs.readdirSync(groupsDir).forEach(filename => {
        const name = path.parse(filename).name
        const content = loadJsonFile.sync(path.resolve(groupsDir, filename))
        groups.push({
          name: name,
          content: content
        })
      })
      // convert json into scene children
      console.log(groups)
      // refresh to load data
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
    dragStart() {
      // console.log('drag started')
    }
  },
  mounted() {},
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
              this.loadMetaData()
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

.group-view {
  height: 42vh;
}

.commits-scroll-area {
  /* overflow: auto; */
  height: 40vh;
  /* position: fixed; */
  /* z-index: 2; */
}

.card-scroll-area {
  /* overflow: auto; */
  height: 35vh;
  /* position: fixed; */
  /* z-index: 2; */
  padding: 5px;
}

.diff-view {
  height: 38vh;
}

.editor {
  height: 48vh;
}
</style>