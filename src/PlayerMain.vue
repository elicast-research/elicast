<template>
  <div class="container">
    <div class="top-controls">
      <button class="btn btn-sm btn-light"
              @click="showLoadSaveModal">Load</button>
    </div>
    <h5>/* Elicast */</h5>
    <component ref="playerPlaceholder" :is="currentPlayer"></component>
    <LoadSaveModal ref="loadSaveModal"
                   @elicastLoaded="loadSaveModalElicastLoaded"></LoadSaveModal>
  </div>
</template>

<script>
import ElicastPlayer from '@/components/Player'
import ElicastService from '@/elicast/elicast-service'
import LoadSaveModal from '@/components/LoadSaveModal'
import _ from 'lodash'
import qs from 'qs'

function newElicastPlayer (elicast) {
  return {
    data () {
      return { elicast }
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
}

export default {
  components: {
    ElicastPlayer,
    LoadSaveModal
  },

  data () {
    return {
      currentPlayer: null
    }
  },

  mounted (t) {
    const params = qs.parse(window.location.search.substr(1))
    if (params.id) {
      ElicastService.loadElicast(params.id)
        .then(this.reloadElicast)
    } else {
      this.showLoadSaveModal()
    }
  },

  methods: {
    showLoadSaveModal () {
      _.defer(() => this.$refs.loadSaveModal.open())
    },
    reloadElicast (newElicast) {
      this.currentPlayer = newElicastPlayer(newElicast)
    },
    loadSaveModalElicastLoaded (elicast) {
      this.reloadElicast(elicast)
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
