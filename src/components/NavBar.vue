<template>
  <div>
    <b-navbar :sticky="true" toggleable="lg" type="dark" variant="info">
      <b-navbar-brand href="#">SmartCommit</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item active href="#">File View</b-nav-item>
          <b-nav-item disabled href="#">Changes View</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">
          <b-nav-item active href="#">{{repoName}}{{currentBranch}}{{trackingBranch}}</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-form>
            <!-- <b-form-input class="mr-sm-2" placeholder="Search" size="sm"></b-form-input> -->
            <b-button
              @click="refresh()"
              class="my-2 my-sm-0"
              size="sm"
              type="submit"
              variant="warning"
            >Refresh</b-button>
          </b-nav-form>

          <b-nav-item-dropdown right text="Lang">
            <b-dropdown-item href="#">EN</b-dropdown-item>
            <b-dropdown-item href="#">中文</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown right>
            <!-- Using 'button-content' slot -->
            <template v-slot:button-content>
              <em>User</em>
            </template>
            <b-dropdown-item href="#">Settings</b-dropdown-item>
            <b-dropdown-item href="#">Release Note</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-form>
            <!-- <b-form-input class="mr-sm-2" placeholder="Search" size="sm"></b-form-input> -->
            <b-button @click="showExitModal()" class="my-2 my-sm-0" size="sm" variant="danger">Exit</b-button>
          </b-nav-form>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <sweet-modal icon="info" overlay-theme="dark" ref="exitModal">
      <b>Are You Sure to Exit?</b>
      <b-button @click="exit()" class="right-button" variant="outline-danger">Yes</b-button>
    </sweet-modal>
  </div>
</template>

<script>
import { SweetModal } from 'sweet-modal-vue'

export default {
  name: 'Cards',

  components: {
    SweetModal
  },
  data() {
    return {
      repoName: '',
      currentBranch: '',
      trackingBranch: ''
    }
  },

  methods: {
    showExitModal() {
      this.$refs.exitModal.open()
    },
    refresh() {
      this.$root.$emit('refresh')
    },
    exit() {
      this.$root.$emit('exit')
    }
  },

  mounted() {
    this.$root.$on(
      'showRepoName',
      (repoName, currentBranch, trackingBranch) => {
        this.repoName = repoName + ': '
        this.currentBranch = currentBranch + '-->'
        this.trackingBranch = trackingBranch
      }
    )
  }
}
</script>
