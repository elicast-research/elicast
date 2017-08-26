<template>
  <div class="container">
    <div class="top-controls">
      <button class="btn btn-sm btn-light"
              @click="showLoadSaveModal">Load/Save</button>
    </div>
    <h5>/* Elicast Editor */</h5>
    <ElicastEditor v-for="(elicast, idx) in elicasts"
                   ref="elicastEditor"
                   :elicast="elicast"
                   :key="elicast.id"></ElicastEditor>
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

const SAMPLE_ELICAST = {
  id: null,
  title: 'Sample elicast',
  ots: [
    new ElicastText(0, 0, 0, INITIAL_CODE, ''),
    new ElicastSelection(0, 0, 0)
  ],
  recordedBlob: null
}

export default {
  components: {
    ElicastEditor,
    LoadSaveModal
  },

  data () {
    return {
      elicasts: [SAMPLE_ELICAST]
    }
  },

  methods: {
    showLoadSaveModal () {
      _.defer(() => this.$refs.loadSaveModal.open(
        this.$refs.elicastEditor.currentElicast))
    },
    reloadElicast (elicast) {
      console.log('Reload elicast', elicast)
      this.elicasts.pop()
      this.elicasts.push(elicast)
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
