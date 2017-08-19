<template>
  <div class="container">
    <h1>Elicast Player</h1>
    <div class="row">
      <ElicastPlayer></ElicastPlayer>
    </div>
  </div>
</template>

<script>
import ElicastPlayer from '@/components/Player'

export default {
  components: {
    ElicastPlayer
  }
}
</script>

<style lang="scss">

h1 {
  margin-top: 1.5rem;
}

</style>
