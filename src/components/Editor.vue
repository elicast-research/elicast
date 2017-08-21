<template>
  <div id="editor">
    <codemirror ref="cm"
                v-model="code"
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
      <div class="ts-display text-secondary">
        {{ tsDisplay }}
      </div>
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
import ElicastOT, { ElicastNop, ElicastText, ElicastSelection } from '@/elicast_ot'
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
  showCursorWhenSelecting: true,
  autofocus: true,
}

const CURSOR_BLINK_RATE = 530 // CodeMirror default cursorBlinkRate: 530ms

const INITIAL_CODE = `def hello(thing):
print(f"hello, {thing}!")

hello("world")`

export default {
  data () {
    return {
      code: INITIAL_CODE,
      ots: [
        new ElicastText(0, 0, 0, INITIAL_CODE, ''),
        new ElicastSelection(1, 0, 0)
      ],
      ts: 0,
      recordStartOt: undefined,
      exerciseStartIndex: -1,
      playMode: PlayMode.STANDBY
    }
  },

  computed: {
    cm() {
      return this.$refs.cm.editor
    },
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
    },
    tsDisplay() {
      const hour = Math.floor(this.ts / 1000 / 60 / 60)
      const min = Math.floor((this.ts / 1000 / 60) % 60)
      const sec = Math.floor((this.ts / 1000) % 60)
      return [hour, [min, String(sec).padStart(2, '0')].join(':')]
        .filter(Boolean).join(':')
    }
  },

  watch: {
    ots(ots, prevOts) {
      const lastOt = ots[ots.length - 1]
      this.$refs.slider.max = lastOt.ts
      this.$refs.slider.val = lastOt.ts
      console.log(lastOt.command, lastOt.ts)

      this.ts = lastOt.ts
    },

    ts(ts, prevTs) {
      this.$refs.slider.val = ts

      if (this.playMode === PlayMode.RECORD) return

      let prevOtIdx = this.ots.findIndex(ot => prevTs < ot.ts)
      prevOtIdx = (prevOtIdx < 0 ? this.ots.length : prevOtIdx) - 1
      let newOtIdx = this.ots.findIndex(ot => ts < ot.ts)
      newOtIdx = (newOtIdx < 0 ? this.ots.length : newOtIdx) - 1

      for (let i = prevOtIdx + 1; i <= newOtIdx && i < this.ots.length; i++) {
        ElicastOT.applyOtToCM(this.cm, this.ots[i])
      }
      for (let i = prevOtIdx; i > newOtIdx && i >= 0; i--) {
        ElicastOT.revertOtToCM(this.cm, this.ots[i])
      }

      if (ts === this.$refs.slider.max) {
        this.playMode = PlayMode.STANDBY
      } else {
        this.playMode = PlayMode.PAUSE
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

  mounted(t) {
    this.cursorBlinkTimer = setInterval(this.toggleCursorBlink, CURSOR_BLINK_RATE)
  },

  beforeDestroy() {
    clearInterval(this.cursorBlinkTimer)
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
      // console.log('onEditorCursorActivity', cm.listSelections()[0].anchor, cm.listSelections()[0].head)
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
    toggleCursorBlink() {
      const cmCursor = this.$el.querySelector('.CodeMirror-cursors')
      cmCursor.style.visibility = cmCursor.style.visibility === 'visible' ? 'hidden' : 'visible'
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

  .ts-display {
    width: 2rem;
    text-align: center;
    font-size: 0.7rem;
  }
}
</style>
