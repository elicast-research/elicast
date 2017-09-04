<template>
  <div class="container">
    <div class="top-controls">
      <button class="btn btn-sm btn-light"
              @click="showLoadSaveModal">Load/Save</button>
    </div>
    <h5>/* Elicast Editor */</h5>
    <component ref="editorPlaceholder" :is="currentEditor"></component>
    <LoadSaveModal ref="loadSaveModal"
                   :enableRemoveButton="true"
                   @elicastLoaded="loadSaveModalElicastLoaded"
                   @elicastSaved="loadSaveModalElicastSaved"></LoadSaveModal>
  </div>
</template>

<script>
import Elicast from '@/elicast/elicast'
import { ElicastSelection } from '@/elicast/elicast-ot'
import ElicastService from '@/elicast/elicast-service'
import ElicastEditor from '@/components/editor'
import LoadSaveModal from '@/components/LoadSaveModal'
import _ from 'lodash'
import qs from 'qs'

const INIT_ELICAST = new Elicast(null, 'Unnamed elicast', [
  new ElicastSelection(0, 0, 0)
], null)

export default {
  components: {
    ElicastEditor,
    LoadSaveModal
  },

  data () {
    return {
      currentEditor: null
    }
  },

  mounted (t) {
    const params = qs.parse(window.location.search.substr(1))
    if (params.id) {
      ElicastService.loadElicast(params.id)
        .then(this.reloadElicast)
    } else {
      this.reloadElicast(INIT_ELICAST)
    }
  },

  methods: {
    showLoadSaveModal () {
      const currentElicast = this.$refs.editorPlaceholder.getCurrentElicast()
      _.defer(() => this.$refs.loadSaveModal.open(currentElicast))
    },
    reloadElicast (newElicast) {
      const newElicastEditor = {
        data () {
          return {
            elicast: newElicast
          }
        },
        methods: {
          getCurrentElicast () {
            return this.$refs.elicastEditor.currentElicast
          }
        },
        template: '<ElicastEditor ref="elicastEditor" :elicast="elicast"></ElicastEditor>',
        components: {
          ElicastEditor
        }
      }
      this.currentEditor = newElicastEditor
    },
    loadSaveModalElicastLoaded (elicast) {
      this.reloadElicast(elicast)
    },
    loadSaveModalElicastSaved (elicast) {
      this.reloadElicast(elicast)
    }
  }
}
</script>

<style lang="scss">

h5 {
  margin: .5rem 0;
  font-family: 'Avenir';
}

.top-controls {
  float: right;
  padding-bottom: 0.1rem;

  button {
    cursor: pointer;
  }
}

</style>
