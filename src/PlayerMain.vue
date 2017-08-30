<template>
  <div class="container">
    <div class="top-controls">
      <!-- <button class="btn btn-sm btn-light"
              @click="showLoadSaveModal">Load/Save</button> -->
    </div>
    <h5>/* Elicast */</h5>
    <component ref="playerPlaceholder" :is="currentPlayer"></component>
  </div>
</template>

<script>
import ElicastPlayer from '@/components/Player'
import Elicast from '@/elicast/elicast'
import ElicastOT from '@/elicast/elicast-ot'
import sampleOts from '@/sample-ots'

const SAMPLE_ELICAST = new Elicast(1, 'Sample elicast', sampleOts.map(ElicastOT.fromJSON), null)

export default {
  components: {
    ElicastPlayer
  },

  data () {
    return {
      currentPlayer: null
    }
  },

  mounted (t) {
    this.reloadElicast(SAMPLE_ELICAST)
  },

  methods: {
    reloadElicast (newElicast) {
      const newElicastPlayer = {
        data () {
          return {
            elicast: newElicast
          }
        },

        methods: {
          getCurrentElicast () {
            return this.$refs.elicastPlayer.currentElicast
          }
        },

        template: '<ElicastPlayer ref="elicastPlayer" :elicast="elicast"></ElicastPlayer>',
        components: {
          ElicastPlayer
        }
      }
      this.currentPlayer = newElicastPlayer
    }
  }
}
</script>

<style lang="scss">

h5 {
  margin-top: 1.5rem;
}

.top-controls {
  float: right;
  padding-bottom: 0.1rem;

  button {
    cursor: pointer;
  }
}


</style>
