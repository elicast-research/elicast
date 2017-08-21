<template>
  <div class="container">
    <h1>/* Elicast Editor */</h1>
    <ElicastEditor></ElicastEditor>
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

h1 {
  margin: 1.5rem 0;
  font-family: 'Avenir';
}

</style>
