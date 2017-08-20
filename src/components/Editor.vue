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

    <button class="btn btn-primary btn-sm"
            v-if="exerciseStartIndex < 0"
            v-on:click="onExerciseStartClick">Start Exercise</button>
    <button class="btn btn-danger btn-sm"
            v-else
            v-on:click="onExerciseStopClick">Stop Exercise</button>
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
      isPlaying: false,
      ots: [],
      exerciseStartIndex: -1
    }
  },
  mounted() {
    this.$refs.slider.max = 100
  },
  methods: {
    onEditorBeforeChange(cm, changeObj) {
      if (!ElicastOT.isChangeAllowed(this.ots, this.exerciseStartIndex, cm, changeObj)) {
        changeObj.cancel();
        return;
      }
      const newOt = ElicastOT.makeOTFromCMChange(cm, changeObj);
      this.ots.push(newOt);
    },
    onEditorCursorActivity(cm) {
      const newOt = ElicastOT.makeOTFromCMSelection(cm);
      this.ots.push(newOt);
    },
    onExerciseStartClick(event) {
      this.exerciseStartIndex = this.ots.length;
    },
    onExerciseStopClick(event) {
      this.exerciseStartIndex = -1;
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
