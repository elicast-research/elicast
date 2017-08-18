<template>
  <div class="slider">
    <svg xmlns="http://www.w3.org/2000/svg" id="slider" viewBox="0 0 100 10" preserveAspectRatio="none">
      <line x1="0" x2="100" y1="5" y2="5" stroke-width="1"/>
    </svg>
  </div>
</template>

<script>
export default {
}
</script>

<style lang="scss">

#slider {
  width: 100%;
  height: 20px;

  line {
    stroke: #868e96;
  }
}
</style>
