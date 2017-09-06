<template>
  <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" @click="close">
    <div class="modal-dialog" role="document" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Load/Save</h5>
        </div>
        <div class="modal-body">
          <div v-show="elicasts !== null && elicasts.length === 0">No screencast yet!</div>
          <ul class="elicast-list">
            <li class="elicast-item clearfix" v-for="elicast in elicasts">
              <a class="elicast-item-load" @click="loadElicast(elicast.id)">
                <span class="elicast-item-id">(ID-{{ elicast.id }})</span>
                <span class="elicast-item-title">{{ elicast.title }}</span>
                <span class="elicast-item-created">{{ elicast.created | formatTimestamp }}</span>
              </a>
              <span v-show="editingElicast != null && !elicast.is_protected" class="pull-right elicast-item-extra-menu">
                <a class="elicast-item-overwrite" @click="overwriteElicast(elicast)">
                  <i class="fa fa-floppy-o" title="overwrite"></i>
                </a>
                <a class="elicast-item-remove" @click="removeElicast(elicast)">
                  <i class="fa fa-times" title="remove"></i>
                </a>
              </span>
            </li>
          </ul>
        </div>
        <div class="modal-footer">
          <button v-show="editingElicast != null"
                  type="button"
                  class="btn btn-primary"
                  @click="saveNewElicast">Save as New</button>
          <button type="button"
                  class="btn btn-secondary"
                  @click="close">Close</button>
        </div>

        <div v-show="isWaitingResponse" class="waiting-overlay">
          <span>
            <i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Please wait...
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ElicastService from '@/elicast/elicast-service'
import dateFormat from 'date-fns/format'
import Modal from 'exports-loader?Modal!bootstrap/js/dist/modal'

export default {
  props: {
    enableRemoveButton: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      modalInstance: null,
      editingElicast: null,
      isShow: false,
      isWaitingResponse: false,
      elicasts: null
    }
  },

  mounted () {
    this.modalInstance = new Modal(this.$el)
    document.addEventListener('keydown', this.handleKeydown)
  },

  beforeDestroy () {
    document.removeEventListener('keydown', this.handleKeydown)
    if (this.modalInstance !== null) {
      this.modalInstance.dispose()
      this.modalInstance = null
    }
  },

  methods: {
    handleKeydown (e) {
      if (this.show && e.keyCode === 27) {
        this.close()
      }
    },
    close () {
      if (this.modalInstance !== null) {
        this.modalInstance.hide()
      }
      this.isShow = false
      this.elicasts = null
    },
    async open (editingElicast) {
      if (this.modalInstance === null) return

      this.editingElicast = editingElicast

      this.isShow = true
      this.modalInstance.show()

      this.isWaitingResponse = true
      this.elicasts = await ElicastService.listElicasts(this.$query.teacher)
      this.isWaitingResponse = false
    },
    async loadElicast (elicastId) {
      this.isWaitingResponse = true
      const elicast = await ElicastService.loadElicast(elicastId)
      this.isWaitingResponse = false

      this.$emit('elicastLoaded', elicast)
      this.close()
    },
    async removeElicast (elicast) {
      if (!confirm('Do you really want to remove [' + elicast.title + ']?')) {
        return
      }

      this.isWaitingResponse = true
      await ElicastService.removeElicast(elicast.id)
      this.isWaitingResponse = false

      // refresh the list
      this.elicasts = await ElicastService.listElicasts(this.$query.teacher)
    },
    async overwriteElicast (elicast) {
      const newElicast = this.editingElicast
      if (!confirm('Do you really want to overwrite [' +
          elicast.title + '] with [' + newElicast.title + ']?')) {
        return
      }

      this.isWaitingResponse = true
      await ElicastService.updateElicast(elicast.id, newElicast, this.$query.teacher)
      await this.loadElicast(elicast.id)
      this.isWaitingResponse = false
    },
    async saveNewElicast () {
      this.isWaitingResponse = true
      const newElicastId = await ElicastService.saveElicast(this.editingElicast, this.$query.teacher)
      this.isWaitingResponse = false

      this.editingElicast.id = newElicastId
      this.$emit('elicastSaved', this.editingElicast)
      this.close()
    }
  },

  filters: {
    formatTimestamp (value) {
      if (!value) return ''
      return dateFormat(value, 'MM/DD/YYYY hh:mm')
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-body {
  max-height: 24rem;
  overflow-y: auto;
}

.elicast-list {
  margin: 1rem;
}

.elicast-item a {
  cursor: pointer;
}

.elicast-item .elicast-item-extra-menu {
  display: none;
}

.elicast-item:hover .elicast-item-extra-menu {
  display: inline-block;
}

.elicast-item .elicast-item-load:hover {
  color: #007bff;
}

.elicast-item .elicast-item-overwrite {
  color: #868e96;
}

.elicast-item .elicast-item-remove {
  color: #868e96;
}

.elicast-item-id {
  color: grey;
}

.elicast-item-title {
  margin-right: 0.2rem;
}

.elicast-item-created {
  font-size: small;
}

.modal-footer button {
  cursor: pointer;
}

.modal-content .waiting-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  text-align: center;
  background-color: rgba(0,0,0,0.7);
  color: white;
  font-size: 2rem;
}

.modal-content .waiting-overlay span {
  position: relative;
  top: 40%;
  transform: translateY(-50%);
}
</style>
