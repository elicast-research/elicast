<template>
  <div class="card run-output-card minified" v-if="isMinified">
    <div class="card-header px-3 py-2">
      Output
      <div class="float-right">
        <a class="text-secondary" @click="toggleMinify">
          <i class="fa fa-window-maximize"></i>
        </a>
      </div>
    </div>
  </div>

  <Resizable class="card run-output-card" v-else>
    <div class="card-header px-3 py-2">
      Output
      <div class="float-right">
        <a class="text-secondary" @click="toggleMinify">
          <i class="fa fa-window-minimize"></i>
        </a>
      </div>
    </div>
    <div class="run-output card-body px-3 py-2">
      {{ output }}
    </div>
    <svg class="resize-handle"
         xmlns="http://www.w3.org/2000/svg"
         width="10px" height="10px" viewBox="0 0 10 10">
      <line x1="0" y1="0" x2="10" y2="10" stroke-width="1"></line>
      <line x1="0" y1="4" x2="6" y2="10" stroke-width="1"></line>
    </svg>
  </Resizable>
</template>

<script>
import Resizable from '@/components/Resizable'

export default {
  props: {
    output: {
      type: String,
      default: ''
    }
  },

  data: () => {
    return {
      isMinified: true
    }
  },

  watch: {
    output (output) {
      this.maximize()
    }
  },

  methods: {
    toggleMinify () {
      this.isMinified = !this.isMinified
    },
    maximize () {
      this.isMinified = false
    }
  },

  components: {
    Resizable
  }
}
</script>

<style lang="scss" scoped>

$codeFontFamily: Menlo, Consolas, 'DejaVu Sans Mono', monospace;

.run-output-card {
  $outputFontSize: .875rem;
  $outputFontColor: #abb2bf;
  $outputBackgroundColor: transparentize(#21252b, 0.15);
  $lineHeight: 1.5;

  font-size: .875rem;
  min-width: 15em;
  max-width: fill-available;
  min-height: $outputFontSize * $lineHeight * 7;
  max-height: $outputFontSize * $lineHeight * 12;
  overflow: hidden;

  background-color: rgba(255, 255, 255, 0.7);

  &.minified {
    min-height: 0;
  }

  .card-header a {
    cursor: pointer;
  }

  .run-output {
    overflow: auto;
    font-size: $outputFontSize;
    font-family: $codeFontFamily;
    line-height: $lineHeight;

    color: $outputFontColor;
    background-color: $outputBackgroundColor;
  }

  .resize-handle {
    position: absolute;
    left: 0;
    bottom: 0;
    line-height: 0;
    cursor: sw-resize;

    line {
      stroke: $outputFontColor;
    }
  }
}
</style>
