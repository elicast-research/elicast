<template>
  <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" @click="close">
    <div class="modal-dialog" role="document" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Load/Save</h5>
        </div>
        <div class="modal-body">
          <div v-show="elicasts == null">Loading...</div>
          <ul class="elicast-list">
            <li class="elicast-item clearfix" v-for="elicast in elicasts">
              <a class="elicast-item-load" @click="loadElicast(elicast.id)">
                <span class="elicast-item-id">(ID-{{ elicast.id }})</span>
                <span class="elicast-item-title">{{ elicast.title }}</span>
                <span class="elicast-item-created">{{ elicast.created | formatTimestamp }}</span>
              </a>
              <span v-show="editingElicast != null" class="pull-right elicast-item-extra-menu">
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
      </div>
    </div>
  </div>
</template>

<script>
import Elicast from '@/elicast/elicast'
import axios from 'axios'
import blobUtil from 'blob-util'
import moment from 'moment'
import Modal from 'exports-loader?Modal!bootstrap/js/dist/modal'
import qs from 'qs'

import ElicastOT from '@/elicast/elicast-ot'

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

      const response = await axios.get('http://anne.pjknkda.com:7822/elicast')
      this.elicasts = response.data.elicasts
    },
    async loadElicast (elicastId) {
      const response = await axios.get('http://anne.pjknkda.com:7822/elicast/' + elicastId)
      const elicastRaw = response.data.elicast

      const elicast = new Elicast(
        elicastRaw.id,
        elicastRaw.title,
        elicastRaw.ots.map(ElicastOT.fromJSON),
        elicastRaw.voice_blob === '' ? null : await blobUtil.dataURLToBlob(elicastRaw.voice_blob)
      )

      this.$emit('elicastLoaded', elicast)
      this.close()
    },
    async removeElicast (elicast) {
      if (!confirm('Do you really want to remove [' + elicast.title + ']?')) {
        return
      }

      await axios.delete('http://anne.pjknkda.com:7822/elicast/' + elicast.id)

      // refresh the list
      const response = await axios.get('http://anne.pjknkda.com:7822/elicast')
      this.elicasts = response.data.elicasts
    },
    async overwriteElicast (elicast) {
      const newElicast = this.editingElicast

      if (!confirm('Do you really want to overwrite [' +
          elicast.title + '] with [' + newElicast.title + ']?')) {
        return
      }

      await axios.post('http://anne.pjknkda.com:7822/elicast/' + elicast.id,
        qs.stringify({
          title: newElicast.title,
          ots: JSON.stringify(newElicast.ots),
          voice_blob: newElicast.voiceBlob ? await blobUtil.blobToDataURL(newElicast.voiceBlob) : ''
        }))

      await this.loadElicast(elicast.id)
    },
    async saveNewElicast () {
      const elicast = this.editingElicast
      const response = await axios.put('http://anne.pjknkda.com:7822/elicast',
        qs.stringify({
          title: elicast.title,
          ots: JSON.stringify(elicast.ots),
          voice_blob: elicast.voiceBlob ? await blobUtil.blobToDataURL(elicast.voiceBlob) : ''
        }))

      elicast.id = response.data.elicast.id
      this.$emit('elicastSaved', elicast)
      this.close()
    }
  },

  filters: {
    formatTimestamp (value) {
      if (!value) return ''
      return moment.unix(value / 1000).format('MM/DD/YYYY hh:mm')
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
</style>
