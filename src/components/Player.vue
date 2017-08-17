<template>
  <div id="player">
    <img src="../assets/logo.png">
    <Hello/>
  </div>
</template>

<script>
import Hello from './Hello'

export default {
  components: {
    Hello
  }
}
</script>

<style>
#player {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
