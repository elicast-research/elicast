<template>
  <div id="editor">
    <codemirror v-model="code"
                :options="editorOptions"
                @beforeChange="onEditorBeforeChange"
                @cursorActivity="onEditorCursorActivity">
    </codemirror>
    <div class="controls">
      <a @click="isPlaying = !isPlaying">
        <i v-show="!isPlaying" class="fa fa-play" aria-hidden="true"></i>
        <i v-show="isPlaying" class="fa fa-pause" aria-hidden="true"></i>
      </a>
      <Slider ref="slider" class="slider" />
    </div>
  </div>
</template>

<script>
import ElicastOT from '@/elicast_ot'
import { codemirror, CodeMirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import Slider from '@/components/slider'


export default {
  data () {
    return {
      code: 'const a = 10',
      editorOptions: {
        // mode: 'python'
        lineNumbers: true,
        cursorBlinkRate: 0, // disable default blinker which is not working in no-focus state
        autofocus: true
      },
      isPlaying: false
    }
  },
  mounted() {
    this.$refs.slider.max = 100
  },
  methods: {
    onEditorBeforeChange(cm, changeObj) {
      console.log('OT', ElicastOT.makeOTFromCMChange(cm, changeObj));
    },
    onEditorCursorActivity(cm) {
      console.log('OT', ElicastOT.makeOTFromCMSelection(cm));
    }
  },
  components: {
    codemirror,
    Slider
  }
}
</script>

<style lang="scss">
.controls {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;

  a {
    width: 1.5rem;
    text-align: center;
    cursor: pointer;
  }

  .slider {
    flex: auto;
  }
}
</style>
