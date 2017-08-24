<template>
  <div class="container">
    <div class="top-controls">
      <button class="btn btn-sm btn-light"
              @click="showLoadSaveModal">Load/Save</button>
    </div>
    <h1>/* Elicast Editor */</h1>
    <ElicastEditor :initial-ots="ots"></ElicastEditor>
    <LoadSaveModal ref="loadSaveModal" @elicastLoaded="loadSaveModalElicastLoaded"></LoadSaveModal>
  </div>
</template>

<script>
import { ElicastNop, ElicastText, ElicastSelection, ElicastExercise, ElicastExerciseShow } from '@/elicast/elicast-ot'
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
      ots: [
        new ElicastText(0, 0, 0, INITIAL_CODE, ''),
        new ElicastSelection(0, 0, 0)
      ]
    }
  },

  methods: {
    showLoadSaveModal () {
      _.defer(this.$refs.loadSaveModal.open)
    },
    loadSaveModalElicastLoaded (elicast) {
      const ots = []
      for (const ot of elicast.ots) {
        let OTClass = ElicastNop
        switch (ot.command) {
          case 'nop':
            OTClass = ElicastNop
            break
          case 'selection':
            OTClass = ElicastSelection
            break
          case 'text':
            OTClass = ElicastText
            break
          case 'exPlaceholder':
            OTClass = ElicastExercise
            break
          case 'exShow':
            OTClass = ElicastExerciseShow
            break
        }
        ots.push(Object.assign(new OTClass(), ot))
      }

      // const recordBlob = new Blob()
    }
  }
}
</script>

<style lang="scss">

h1 {
  margin: 1.5rem 0;
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
