<template>
  <div id="editor">
    <codemirror v-model="code"
                :options="editorOptions"
                @beforeChange="onEditorBeforeChange"
                @cursorActivity="onEditorCursorActivity">
    </codemirror>

    <div class="controls">
      <a @click="togglePlayMode">
        <i v-show="isPlayback" class="fa fa-play" aria-hidden="true"></i>
        <i v-show="isPause" class="fa fa-pause" aria-hidden="true"></i>
        <i v-show="isStandby" class="fa fa-video-camera" aria-hidden="true"></i>
        <i v-show="isRecord" class="fa fa-video-camera text-danger" aria-hidden="true"></i>
      </a>
      <Slider ref="slider" class="slider" @change="handleSliderChange" :disabled="isRecord" />
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

const PlayMode = {
  PLAYBACK: 'playback',
  PAUSE: 'pause',
  STANDBY: 'standby',
  RECORD: 'record'
}

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
      ots: [],
      exerciseStartIndex: -1,
      ts: 0,
      playMode: PlayMode.STANDBY
    }
  },
  computed: {
    isPause() {
      return this.playMode === PlayMode.PLAYBACK
    },
    isPlayback() {
      return this.playMode === PlayMode.PAUSE
    },
    isStandby() {
      return this.playMode === PlayMode.STANDBY
    },
    isRecord() {
      return this.playMode === PlayMode.RECORD
    }
  },
  watch: {
    ts(newTs) {
      if (newTs === this.$refs.slider.max) {
        this.playMode = PlayMode.STANDBY
      } else {
        this.playMode = PlayMode.PAUSE
      }
    }
  },
  mounted() {
    this.$refs.slider.max = 100
    this.$refs.slider.val = 100
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
      console.log('OT', ElicastOT.makeOTFromCMSelection(cm));
    },
    handleSliderChange(val) {
      this.ts = val
    },
    togglePlayMode() {
      const toggleState = {
        [PlayMode.PLAYBACK]: PlayMode.PAUSE,
        [PlayMode.PAUSE]: PlayMode.PLAYBACK,
        [PlayMode.STANDBY]: PlayMode.RECORD,
        [PlayMode.RECORD]: PlayMode.STANDBY
      }
      this.playMode = toggleState[this.playMode]
    }
  },
  components: {
    codemirror,
    Slider
  }
}
</script>

<style lang="scss">
.CodeMirror {
  border: 1px solid #eee;
}

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
