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
    this.reloadElicast()
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

h1 {
  margin-top: 1.5rem;
}

</style>
