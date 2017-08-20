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
import ElicastOT, { ElicastNop, ElicastText } from '@/elicast_ot'
import { codemirror, CodeMirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/python/python'
import Slider from '@/components/slider'

const PlayMode = {
  PLAYBACK: 'playback',
  PAUSE: 'pause',
  STANDBY: 'standby',
  RECORD: 'record'
}

const EDITOR_OPTIONS = {
  mode: 'python',
  lineNumbers: true,
  cursorBlinkRate: 0, // disable default blinker which is not working in no-focus state
  autofocus: true,
}

const INITIAL_CODE = `def hello(thing):
print(f"hello, {thing}!")

hello("world")`

export default {
  data () {
    return {
      code: INITIAL_CODE,
      ots: [ new ElicastText(1, 0, 0, INITIAL_CODE, '') ],
      ts: 0,
      recordStartOt: undefined,
      exerciseStartIndex: -1,
      playMode: PlayMode.STANDBY
    }
  },
  computed: {
    editorOptions() {
      return Object.assign({
        readOnly: this.playMode === PlayMode.RECORD ? false : 'nocursor'
      }, EDITOR_OPTIONS)
    },
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
    ots(ots) {
      const lastOt = ots[ots.length - 1]
      this.$refs.slider.max = lastOt.ts
      this.$refs.slider.val = lastOt.ts
      console.log(lastOt.command, lastOt.ts)

      this.ts = lastOt.ts
    },
    ts(ts) {
      this.$refs.slider.val = ts

      switch (this.playMode) {
        case PlayMode.PLAYBACK:
        case PlayMode.PAUSE:
        case PlayMode.STANDBY:
          if (ts === this.$refs.slider.max) {
            this.playMode = PlayMode.STANDBY
          } else {
            this.playMode = PlayMode.PAUSE
          }
          break
      }
    },
    playMode(playMode, prevPlayMode) {
      if (playMode === PlayMode.RECORD) {
        const lastTs = this.ots.length ? this.ots[this.ots.length - 1].ts : 0
        this.recordStartOt = new ElicastNop(lastTs)
        this.ots.push(this.recordStartOt)
      } else if (prevPlayMode === PlayMode.RECORD) {
        const ts = this.recordStartOt.getRelativeTS()
        this.ots.push(new ElicastNop(ts))
      }
    }
  },
  mounted() {
  },
  methods: {
    onEditorBeforeChange(cm, changeObj) {
      if (this.playMode !== PlayMode.RECORD) return

      if (!ElicastOT.isChangeAllowed(this.ots, this.exerciseStartIndex, cm, changeObj)) {
        changeObj.cancel();
        return;
      }
      const ts = this.recordStartOt.getRelativeTS()
      const newOt = ElicastOT.makeOTFromCMChange(cm, changeObj, ts)
      this.ots.push(newOt)
    },
    onEditorCursorActivity(cm) {
      if (this.playMode !== PlayMode.RECORD) return

      const ts = this.recordStartOt.getRelativeTS()
      const newOt = ElicastOT.makeOTFromCMSelection(cm, ts)
      this.ots.push(newOt)
    },
    onExerciseStartClick(event) {
      this.exerciseStartIndex = this.ots.length;
    },
    onExerciseStopClick(event) {
      this.exerciseStartIndex = -1;
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
