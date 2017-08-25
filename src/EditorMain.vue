<template>
  <div class="container">
    <div class="top-controls">
      <button class="btn btn-sm btn-light"
              @click="showLoadSaveModal">Load/Save</button>
    </div>
    <h5>/* Elicast Editor */</h5>
    <ElicastEditor ref="elicastEditor"></ElicastEditor>
    <LoadSaveModal ref="loadSaveModal"
                   @elicastLoaded="loadSaveModalElicastLoaded"
                   @elicastSaved="loadSaveModalElicastSaved"></LoadSaveModal>
  </div>
</template>

<script>
import { ElicastText, ElicastSelection } from '@/elicast/elicast-ot'
import ElicastEditor from '@/components/editor'
import LoadSaveModal from '@/components/LoadSaveModal'
import _ from 'lodash'

const INITIAL_CODE = `def hello(thing):
  print(f"hello, {thing}!")

hello("world")`

export default {
  components: {
    ElicastEditor,
    LoadSaveModal
  },

  data () {
    return {
      sampleElicast: {
        id: null,
        title: 'Sample elicast',
        ots: [
          new ElicastText(0, 0, 0, INITIAL_CODE, ''),
          new ElicastSelection(0, 0, 0)
        ],
        recordedBlob: null
      }
    }
  },

  methods: {
    showLoadSaveModal () {
      _.defer(() => this.$refs.loadSaveModal.open(this.$refs.elicastEditor.currentElicast))
    },
    loadSaveModalElicastLoaded (elicast) {
      this.$refs.elicastEditor.loadElicast(elicast)
    },
    loadSaveModalElicastSaved (elicast) {
      this.$refs.elicastEditor.loadElicast(elicast)
    }
  },

  mounted (t) {
    this.$refs.elicastEditor.loadElicast(this.sampleElicast)
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
