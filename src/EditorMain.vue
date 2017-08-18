<template>
  <div class="container">
    <h1>Elicast Editor</h1>
    <!-- <div class="row"> -->
      <ElicastEditor></ElicastEditor>
    <!-- </div> -->
  </div>
</template>

<script>
import ElicastEditor from '@/components/Editor'

export default {
  components: {
    ElicastEditor
  }
}
</script>

<style lang="scss">

@import "~bootstrap/scss/bootstrap";

h1 {
  margin-top: 1.5rem;
}

</style>
