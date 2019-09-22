<template>
  <div>
    <b-form-row>
      <b-col cols="3">
        <div class="button-area">
          <div class="center-area" v-if="loadingHistory">
            <center>
              <b-button disabled variant="primary">
                <b-spinner small type="grow"></b-spinner>Loading Commit History...
              </b-button>
            </center>
          </div>
          <b-button
            :variant="highlightPush"
            @click="readyToPush"
            v-if="successCommits.length>0"
          >Push to Remote</b-button>
        </div>
        <div class="scroll-area" v-if="graphLoadedOk">
          <vuescroll>
            <div id="graph-container" ref="graph-container"></div>
          </vuescroll>
        </div>
      </b-col>
      <b-col cols="9">
        <!-- uncommittedFilesNum is originaly used as a trick to forcely refresh this component, now it records whether working dir is clean -->
        <div :key="uncommittedFilesNum" class="card-scene">
          <div class="center-area" v-if="loadingStatus">
            <center>
              <b-button disabled variant="success">
                <b-spinner small type="grow"></b-spinner>Loading Working Directory...
              </b-button>
            </center>
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
                    <!-- <b-form-input placeholder="Commit Message" v-model="column.message"></b-form-input> -->
                    <b-form-textarea
                      max-rows="10"
                      placeholder="Commit Message"
                      rows="3"
                      v-model="column.message"
                    ></b-form-textarea>
                    <b-input-group-append>
                      <!-- disable button if the message is empty with: :disabled="!column.message" -->
                      <b-button
                        @click="column.message=''"
                        title="Clear"
                        v-b-tooltip.hover
                        variant="outline-danger"
                      >
                        <v-icon name="eraser" />
                      </b-button>
                      <b-button
                        @click="readyToCommit(column.id, column.message, column.children)"
                        title="Ok"
                        v-b-tooltip.hover
                        variant="outline-success"
                      >
                        <v-icon name="check" />
                      </b-button>
                    </b-input-group-append>
                  </b-input-group>
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
                      <b-button @click="onClose" aria-label="Close" class="close">
                        <span aria-hidden="true" class="d-inline-block">&times;</span>
                      </b-button>Recommended Words
                    </template>
                    <div class="words">
                      <b-badge
                        :key="word.id"
                        :variant="word.type"
                        @click="column.message=appendWord(column.message, word.content)"
                        pill
                        v-for="word in hintWords"
                      >{{word.content}}</b-badge>
                    </div>
                  </b-popover>
                </div>
                <br />
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
                      @dblclick="showDiffWithSweet(card.path, card.abs_path, card.type, card.operation, card.language)"
                      class="no-select"
                    >
                      <p class="no-select" title="Double Click to Show Diff" v-b-tooltip.hover>
                        {{ card.path }}
                        <b-badge
                          :variant="card.badgeType"
                          pill
                          style="float:right"
                        >{{card.operation}}</b-badge>
                      </p>
                    </div>
                  </Draggable>
                </Container>
              </div>
            </Draggable>
            <b-button
              @click="appendNewGroup"
              v-if="uncommittedFilesNum>0"
              variant="outline-success"
            >Create new Group</b-button>
          </Container>
        </div>
      </b-col>
    </b-form-row>

    <div class="center-area" v-if="loadingStatus==false && uncommittedFilesNum==0">
      <center>
        <b-button-group>
          <b-button variant="info">Working Directory is</b-button>
          <b-button variant="success">Clean</b-button>
          <b-button variant="warning">🐶</b-button>
        </b-button-group>
      </center>
    </div>

    <!-- dialog to confirm commit -->
    <sweet-modal ref="commitModal" title="Ready to Commit?">
      <template slot="box-action">
        <b-badge pill variant="info">{{currentBranch}}</b-badge>&nbsp;->
        <b-badge pill variant="warning">{{trackingBranch}}</b-badge>&nbsp;
      </template>
      <b-card border-variant="success" header="Following files will be committed:">
        <b-list-group deck>
          <b-list-group-item
            :key="file.id"
            :variant="file.badgeType"
            href="#"
            v-for="file in commitFiles"
          >
            {{file.short_path}}
            <b-badge :variant="file.badgeType" pill style="float:right">{{file.operation}}</b-badge>
          </b-list-group-item>
          <p class="card-text mt-2">{{commitMessage}}</p>
        </b-list-group>
      </b-card>
      <b-button class="right-button" disabled v-if="committing" variant="success">
        <b-spinner small></b-spinner>&nbsp;Committing...
      </b-button>
      <b-button @click="reallyCommit()" class="right-button" v-else variant="success">Commit!</b-button>
      <b-button @click="cancelCommit()" class="right-button" variant="outline-primary">Cancel</b-button>
    </sweet-modal>

    <!-- dialog to confirm push -->
    <sweet-modal ref="pushModal" title="Ready to Push?">
      <template slot="box-action">
        <b-badge pill variant="info">{{currentBranch}}</b-badge>&nbsp;->
        <b-badge pill variant="warning">{{trackingBranch}}</b-badge>&nbsp;
      </template>
      <b-card border-variant="success" header="Commits within the tool:">
        <b-list-group>
          <b-list-group-item
            :key="commit.hash"
            v-for="commit in successCommits"
          >{{commit.hash + ": " + commit.msg}}</b-list-group-item>
        </b-list-group>
      </b-card>
      <b-progress
        :animated="animate"
        :value="pushProgress"
        striped
        v-if="pushing"
        variant="success"
      ></b-progress>
      <!-- <b-button class="right-button" disabled v-if="pushing" variant="success">
        <b-spinner small></b-spinner>&nbsp;Pushing...
      </b-button>-->
      <div v-else>
        <b-button @click="reallyPush()" class="right-button" variant="success">Push!</b-button>
        <b-button @click="cancelPush()" class="right-button" variant="outline-primary">Cancel</b-button>
      </div>
    </sweet-modal>

    <!-- use 'hide-close-button blocking' to force user action -->
    <sweet-modal icon="success" ref="success" title="Success">{{successMessage}}</sweet-modal>
    <sweet-modal icon="warning" ref="alert" title="Alert">{{alertMessage}}</sweet-modal>
    <sweet-modal blocking hide-close-button icon="info" overlay-theme="dark" ref="usageModal">
      <b>Usage:</b>
      <br />1. Open terminal under a Git repo.
      <br />2. Run `git sc` in terminal.
      <br />
      <b-button @click="exit()" class="right-button" variant="outline-danger">Got It!</b-button>
    </sweet-modal>

    <sweet-modal icon="error" ref="error" title="Error">{{errorMessage}}</sweet-modal>

    <!-- modal to show diff view-->
    <!-- sweet-modal-vue -->
    <sweet-modal :title="diffViewTitle" ref="diffViewModal" width="80%">
      <template slot="box-action">
        <b-badge pill variant="info">{{language}}</b-badge>&nbsp;
      </template>
      <sweet-modal-tab id="sideDiff" title="Side by Side">
        <div v-if="loadingDiff">
          <b-spinner label="Spinning" variant="success"></b-spinner>
        </div>
        <MonacoEditor
          :diffEditor="true"
          :language="language"
          :options="sideOptions"
          :original="codeLeft"
          :value="codeRight"
          class="editor"
          ref="sideDiffEditor"
          v-else
        />
      </sweet-modal-tab>
      <sweet-modal-tab id="inlineDiff" title="Inline Diff">
        <div v-if="loadingDiff">
          <b-spinner label="Spinning" variant="success"></b-spinner>
        </div>
        <MonacoEditor
          :diffEditor="true"
          :language="language"
          :options="inlineOptions"
          :original="codeRight"
          :value="codeLeft"
          class="editor"
          ref="inlineDiffEditor"
          v-else
        />
      </sweet-modal-tab>
    </sweet-modal>
  </div>
</template>

<script>
import { Container, Draggable } from 'vue-smooth-dnd'
import vuescroll from 'vuescroll'
import { applyDrag, generateItems, truncateLongPath } from './utils/helpers'
import {
  getRootPath,
  analyzeStatus,
  doCommit,
  doPush,
  showAtHEAD
} from './utils/gitutils'
import { SweetModal, SweetModalTab } from 'sweet-modal-vue'
import MonacoEditor from './vue-monaco'

const fs = require('fs')
var git = require('simple-git')
const git2json = require('@fabien0102/git2json')

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

  components: {
    Container,
    Draggable,
    MonacoEditor,
    SweetModal,
    SweetModalTab,
    vuescroll
  },

  data() {
    return {
      scene,
      uncommittedFilesNum: 0,
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
      menu: [
        {
          href: '/',
          title: 'Dashboard',
          icon: 'fa fa-user'
        },
        {
          href: '#',
          title: 'Charts',
          icon: 'fa fa-chart-area'
        }
      ],

      successMessage: '',
      alertMessage: '',
      errorMessage: '',

      // repo data
      REPO_PATH: '',
      currentBranch: '',
      trackingBranch: '',
      loadingStatus: true,

      // diff editor options
      sideOptions: {
        // selectOnLineNumbers: true
        readOnly: true,
        renderSideBySide: true
      },
      inlineOptions: {
        // selectOnLineNumbers: true
        readOnly: true,
        renderSideBySide: false
      },

      // diff view data
      diffViewTitle: '',
      loadingDiff: true,
      language: 'javascript',
      codeLeft: '',
      codeRight: '',

      // graph view data
      loadingHistory: true,
      graphLoadedOk: true,
      gitGraph: '',
      graphBranch: undefined,
      highlightPush: 'outline-primary',

      // commit
      columnID: -1, // to remove and refresh the successfully committed column
      // temp message container
      commitMessage: '',
      commitFiles: [],
      committing: false, // processing the commit action
      // persistent messages container
      successCommits: [],

      // recommended words in commit message
      hintWords: [],

      // push
      animate: true,
      pushing: false,
      pushProgress: 0
    }
  },

  methods: {
    exit() {
      const remote = require('electron').remote
      let w = remote.getCurrentWindow()
      w.close()
    },
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
      // this.$root.$emit('bv::hide::popover', 'msg_popover')
      this.$root.$emit('bv::hide::popover')
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
          (ref.$el || ref).focus()
        })
      })
    },

    // a trick to forcely refresh the component
    refreshCards(committedFilesNum) {
      this.uncommittedFilesNum -= committedFilesNum
      if (this.uncommittedFilesNum <= 0 || this.successCommits.length > 0) {
        this.highlightPush = 'success'
      }
    },

    log(...params) {
      console.log(...params)
    },

    getBadgeType(operation) {
      return badgeTypeMap.get(operation)
    },

    // TODO refresh hint words according to column.children
    getHintWords() {
      this.hintWords.push({
        id: '0',
        type: 'success',
        content: 'Add'
      })
      this.hintWords.push({
        id: '1',
        type: 'danger',
        content: 'Delete'
      })
      this.hintWords.push({
        id: '2',
        type: 'info',
        content: 'Modify'
      })
      this.hintWords.push({
        id: '3',
        type: 'primary',
        content: 'Refactor'
      })
      this.hintWords.push({
        id: '4',
        type: 'warning',
        content: 'Format'
      })
      this.hintWords.push({
        id: '5',
        type: 'success',
        content: 'Fix'
      })
    },
    appendWord(msg, word) {
      if (msg == '') {
        return word
      }
      if (msg.endsWith(' ')) {
        return msg + word
      } else {
        return msg + ' ' + word
      }
    },

    //  prepare data by analyzing git repo
    init() {
      this.getHintWords()
      // console.log("Analyzing git repo "+ __dirname);
      getRootPath(this.REPO_PATH)
        .then(rootPath => {
          this.REPO_PATH = rootPath + '/'
          console.log('Repo root path: ' + this.REPO_PATH)
          this.analyzeGitRepo()
        })
        .catch(err => {
          this.loadingStatus = false
          console.log(err)
          this.errorMessage = err.message
          this.$refs.error.open()
        })
    },
    filterDiffs(diffs) {
      let res = []
      for (let k in diffs) {
        if (diffs[k].length > 0) {
          res.push(diffs[k])
        }
      }
      return res
    },

    analyzeGitRepo() {
      analyzeStatus(this.REPO_PATH)
        .then(status => {
          this.currentBranch = status.current
          this.trackingBranch = status.tracking

          // this.graphBranch = this.gitGraph.branch(String(this.currentBranch))

          let res = this.filterDiffs(status.diffs)
          let num = 0
          for (let i of res) {
            num += i.length
          }
          this.uncommittedFilesNum = num
          console.log('Uncommitted files: ' + this.uncommittedFilesNum)
          this.scene = {
            type: 'container',
            props: {
              orientation: 'horizontal'
            },
            // group changes according to the operation, then generate the code
            children: generateItems(res.length, i => ({
              id: i,
              type: 'container',
              name: `Group ${i}`,
              props: {
                orientation: 'vertical',
                className: 'card-container'
              },
              message: '',
              committed: false, // whether the group has been committed
              children: generateItems(res[i].length, j => ({
                type: 'draggable',
                id: `${i}${j}`,
                props: {
                  className: 'card',
                  style: { backgroundColor: pickColor() }
                },
                operation: res[i][j].operation,
                badgeType: this.getBadgeType(res[i][j].operation),
                path: res[i][j].path,
                abs_path: res[i][j].abs_path,
                type: res[i][j].type,
                language: res[i][j].lang
              }))
            }))
          }
          this.loadingStatus = false
          // console.log(this.scene)
          this.refreshCards(0)
        })
        .catch(err => {
          this.loadingStatus = false
          console.log(err)
          this.errorMessage = err
          this.$refs.error.open()
        })
    },

    // show diffs with alternative modal
    showDiffWithSweet(path, abs_path, type, operation, language) {
      this.$refs.diffViewModal.open('sideDiff')
      this.loadingDiff = true
      this.diffViewTitle = abs_path
      if (type == 'text') {
        if (operation == 'Untracked' || operation == 'Created') {
          // when the file is newly added
          this.codeLeft = ''
          fs.readFile(abs_path, 'utf-8', (err, data) => {
            if (err) {
              this.errorMessage =
                'An error ocurred reading the file :' + err.message
              this.$refs.diffViewModal.close()
              this.$refs.error.open()
              return
            }
            this.language = language
            // this.$refs.sideDiffEditor.setLanguage(language)
            this.loadingDiff = false

            this.codeRight = data
          })
        } else if (operation == 'Deleted') {
          // when the file is deleted
          this.language = language
          this.codeRight = ''

          showAtHEAD(this.REPO_PATH, path)
            .then(res => {
              this.codeLeft = res
              this.loadingDiff = false
            })
            .catch(err => {
              console.log(err)
              this.errorMessage =
                'An error ocurred reading the file :' + err.message
              this.$refs.diffViewModal.close()
              this.$refs.error.open()
            })
        } else {
          // when the file is Modified/Conflicted/Renamed
          fs.readFile(abs_path, 'utf-8', (err, data) => {
            if (err) {
              this.errorMessage =
                'An error ocurred reading the file :' + err.message
              this.$refs.diffViewModal.close()
              this.$refs.error.open()
              return
            }
            this.language = language
            // this.$refs.sideDiffEditor.setLanguage(language)

            this.codeRight = data

            showAtHEAD(this.REPO_PATH, path)
              .then(res => {
                this.codeLeft = res
                this.loadingDiff = false
              })
              .catch(err => {
                console.log(err)
                this.errorMessage =
                  'An error ocurred reading the file :' + err.message
                this.$refs.diffViewModal.close()
                this.$refs.error.open()
              })
          })
        }
      } else {
        // if the file is not a text file, just tell the user the type

        this.language = language
        if (operation == 'Untracked' || operation == 'Created') {
          // TODO a strange bug here: code left is what is last diffed instead of empty
          this.codeLeft = ''
          this.codeRight = 'This is a ' + type + ' file.'
        } else if (operation == 'Deleted') {
          this.codeLeft = 'This is a ' + type + ' file.'
          this.codeRight = ''
        } else {
          this.codeLeft = 'This is a ' + type + ' file.'
          this.codeRight = 'This is a ' + type + ' file.'
        }
        this.loadingDiff = false
      }
    },

    // handle commit action
    readyToCommit(id, message, list) {
      if (list.length == 0) {
        this.alertMessage = 'No files to commit in this group!'
        this.$refs.alert.open()
      } else if (message === '') {
        this.alertMessage = 'The commit message cannot be empty!'
        this.$refs.alert.open()
      } else {
        this.commitMessage = message
        // truncate long paths to make sure one path one line
        this.commitFiles = []
        for (let f of list) {
          f.short_path = truncateLongPath(f.path, 55)
          this.commitFiles.push(f)
        }
        this.columnID = id
        this.$refs.commitModal.open()
        this.committing = false
      }
    },

    reallyCommit() {
      let filePaths = new Array()
      this.committing = true
      for (let file of this.commitFiles) {
        filePaths.push(file.path)
      }
      doCommit(this.REPO_PATH, this.commitMessage, filePaths)
        .then(res => {
          this.successMessage =
            'Successfully commit ' + res.commit + ' to branch ' + res.branch
          this.$refs.commitModal.close()
          this.$refs.success.open()
          if (this.graphBranch == undefined) {
            this.refreshGraph()
          } else {
            this.graphBranch.commit(this.commitMessage)
          }
          // clear data (no necessary but for safety)
          this.committing = false
          this.successCommits.push({
            hash: res.commit,
            msg: this.commitMessage
          })
          this.commitMessage = ''
          this.commitFiles = []
          // remove the committed column from scene
          this.removeColumnByID(this.columnID)
          this.refreshCards(filePaths.length)
        })
        .catch(err => {
          console.log(err)
          this.errorMessage = err
          this.$refs.error.open()
        })
    },

    cancelCommit() {
      this.$refs.commitModal.close()
    },

    // handle push operation
    readyToPush() {
      this.$refs.pushModal.open()
    },
    moveOn() {
      this.pushProgress += 10
    },
    reallyPush() {
      this.pushing = true
      setInterval(this.moveOn, 1000)
      doPush(this.REPO_PATH, this.currentBranch, this.trackingBranch)
        .then(res => {
          console.log(res)
          this.successMessage =
            'Successfully push ' +
            this.currentBranch +
            ' to ' +
            this.trackingBranch
          this.$refs.pushModal.close()
          this.$refs.success.open()
          this.pushing = false
          this.successCommits = []
        })
        .catch(err => {
          console.log(err)
          this.errorMessage = err
          this.$refs.error.open()
        })
    },

    cancelPush() {
      this.$refs.pushModal.close()
    },

    removeColumnByID(id) {
      const scene = Object.assign({}, this.scene)
      scene.children = []
      for (let child of this.scene.children) {
        if (child.id != id) {
          scene.children.push(child)
        }
      }
      this.scene = scene
    },

    appendNewGroup() {
      const scene = Object.assign({}, this.scene)
      let maxID = -1
      for (let child of this.scene.children) {
        maxID = child.id > maxID ? child.id : maxID
      }
      let i = maxID + 1
      scene.children.push({
        id: i,
        type: 'container',
        name: `Group ${i}`,
        props: {
          orientation: 'vertical',
          className: 'card-container'
        },
        message: '',
        committed: false,
        children: []
      })
      this.scene = scene
    },

    createGraph(graphContainer) {
      // Instantiate the graph.
      let options = {
        mode: GitgraphJS.Mode.Compact,
        template: GitgraphJS.TemplateName.BlackArrow,
        reverseArrow: true
      }
      this.gitGraph = GitgraphJS.createGitgraph(graphContainer, options)
      try {
        this.refreshGraph()
      } catch (err) {
        // if fail to the commit graph, fake one
        console.log(err)
        this.graphBranch = this.gitGraph.branch('master')
        this.graphBranch.commit('HEAD Commit.')
        this.loadingHistory = false
      }
    },

    refreshGraph() {
      // let path = this.REPO_PATH
      // const path =  'F:/workspace/dev/IntelliMerge'
      // git2json.run({path}).then(gitlog => {
      git2json
        .run()
        .then(gitlog => {
          // display at most N commits for performance and layout
          if (gitlog.length <= 15) {
            this.gitGraph.import(gitlog)
          } else {
            let slicedLog = gitlog.slice(0, 15)
            let processedLog = []
            // sort the sliced log by time
            // slicedLog.sort((a, b) => parseInt(b.committer.timestamp) - parseInt(a.committer.timestamp))
            // find the last commit whose parents are not in the sliced log
            let slicedCommits = slicedLog.map(a => a.hashAbbrev)
            for (let commit of slicedLog) {
              let isIn = false
              for (let parent of commit.parentsAbbrev) {
                if (slicedCommits.includes(parent)) {
                  isIn = true
                  processedLog.push(commit)
                  break
                }
              }
              if (!isIn) {
                commit.parents = []
                commit.parentsAbbrev = []
                processedLog.push(commit)
              }
            }
            this.gitGraph.import(processedLog)
          }
          this.graphLoadedOk = true
          this.loadingHistory = false
        })
        .catch(err => {
          // hide the graph sidebar in case of error
          this.graphLoadedOk = false
        })
    }
  },

  created() {
    const gitt = git(this.REPO_PATH)

    gitt.checkIsRepo((err, res) => {
      if (err) {
        this.alertMessage = err
        this.$refs.alert.open()
      } else {
        if (res) {
          this.init()
        } else {
          this.$refs.usageModal.open()
        }
      }
    })
  },

  mounted() {
    const graphContainer = document.querySelector('#graph-container')
    // const graphContainer = this.$refs['container']
    this.createGraph(graphContainer)
    // register functions to be called by the navbar
    this.$root.$on('refresh', () => {
      console.log('Refreshing...')
      // this.refreshGraph()
      this.refreshCards(0)
    })
    this.$root.$on('exit', () => {
      console.log('Exiting...')
      // this.refreshGraph()
      this.exit()
    })
  }
}
</script>

<style>
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

.words {
  cursor: pointer;
}

.editor {
  height: 80vh;
}

.sweet-modal .sweet-title h2 {
  line-height: inherit;
}

.right-button {
  float: right;
  margin-top: 10px;
  margin-right: 10px;
}

.scroll-area {
  /* overflow: auto; */
  height: 90vh;
  position: fixed;
  /* z-index: 2; */
  width: 26vw; /* 3/12 + 10px */
  padding: 10px;
}

.button-area {
  text-align: center;
  padding-top: 20px;
  align-items: center;
}

/* .container {
  position: relative;
} */

.center-area {
  padding-top: 20px;
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}
</style>
