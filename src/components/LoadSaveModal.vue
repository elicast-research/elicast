<template>
  <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" @click="close">
    <div class="modal-dialog" role="document" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Load/Save</h5>
        </div>
        <div class="modal-body">
          <ul class="elicast-list">
            <li class="elicast-item clearfix" v-for="elicast in elicasts">
              <span class="elicast-item-id">(ID-{{ elicast.id }})</span>
              <span class="elicast-item-title">{{ elicast.title }}</span>
              <span class="elicast-item-created">{{ elicast.created | formatTimestamp }}</span>
              <span class="pull-right">
                <button class="btn btn-sm btn-link elicast-item-load"
                        @click="loadElicast(elicast.id)">Load</button>
              </span>
            </li>
          </ul>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="saveElicast">Save</button>
          <button type="button" class="btn btn-secondary" @click="close">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import blobUtil from 'blob-util'
import moment from 'moment'
import Modal from 'exports-loader?Modal!bootstrap/js/dist/modal'
import qs from 'qs'
import _ from 'lodash'

import { ElicastNop, ElicastSelection, ElicastText,
  ElicastExercise, ElicastExerciseShow, ElicastRun } from '@/elicast/elicast-ot'

const OT_CLASS_MAP = _.keyBy(
  [
    ElicastNop,
    ElicastSelection,
    ElicastText,
    ElicastExercise,
    ElicastExerciseShow,
    ElicastRun
  ],
  otClass => otClass.COMMAND
)

export default {
  props: {
    enableDelete: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      modalInstance: null,
      editingElicast: null,
      isShow: false,
      elicasts: []
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
    },
    async open (editingElicast) {
      if (this.modalInstance === null) return

      this.editingElicast = editingElicast

      const response = await axios.get('http://anne.pjknkda.com:7822/elicast')
      this.elicasts = response.data.elicasts
      this.isShow = true
      this.modalInstance.show()
    },
    async loadElicast (elicastId) {
      const response = await axios.get('http://anne.pjknkda.com:7822/elicast/' + elicastId)
      const elicastRaw = response.data.elicast

      const elicast = {
        id: elicastRaw.id,
        title: elicastRaw.title,
        ots: elicastRaw.ots.map(
          otRaw => OT_CLASS_MAP[otRaw.command].fromJSON(otRaw)),
        recordedBlob: elicastRaw.voice_blob === '' ? null : await blobUtil.dataURLToBlob(elicastRaw.voice_blob)
      }

      this.$emit('elicastLoaded', elicast)
      this.close()
    },
    async saveElicast () {
      const elicast = this.editingElicast
      const response = await axios({
        method: elicast.id === null ? 'put' : 'post',
        url: 'http://anne.pjknkda.com:7822/elicast' + (elicast.id === null ? '' : '/' + elicast.id),
        data: qs.stringify({
          title: elicast.title,
          ots: JSON.stringify(elicast.ots),
          voice_blob: elicast.recordedBlob === null ? '' : await blobUtil.blobToDataURL(elicast.recordedBlob)
        })
      })

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

// .elicast-item button {
//   display: none;
// }
//
// .elicast-item:hover button {
//   display: inline-block;
// }

.elicast-item-id {
  color: grey;
}

.elicast-item-title {
  margin-right: 0.2rem;
}

.elicast-item-created {
  font-size: small;
}

.elicast-item-load, .elicast-item-overwrite {
  cursor: pointer;
}
</style>
