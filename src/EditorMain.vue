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
import { ElicastText, ElicastSelection } from '@/elicast/elicast-ot'
import Elicast from '@/elicast/elicast'
import ElicastEditor from '@/components/editor'
import LoadSaveModal from '@/components/LoadSaveModal'
import _ from 'lodash'

const INITIAL_CODE = `def hello(thing):
  print(f"hello, {thing}!")

hello("world")`

const SAMPLE_ELICAST = new Elicast(null, 'Sample elicast', [
  new ElicastText(0, 0, 0, INITIAL_CODE, ''),
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
    this.reloadElicast(SAMPLE_ELICAST)
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
