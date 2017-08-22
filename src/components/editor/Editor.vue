<template>
  <div id="editor">
    <div class="editor-wrap">
      <codemirror ref="cm"
                  v-model="code"
                  :options="editorOptions"
                  @beforeChange="onEditorBeforeChange"
                  @cursorActivity="onEditorCursorActivity">
      </codemirror>

      <button class="btn btn-sm btn-light"
              v-show="playMode.isRecording()"
              @click="toggleRecordExercise">
        <span v-show="playMode === PlayMode.RECORD" class="text-danger">EX_START</span>
        <span v-show="playMode === PlayMode.RECORD_EXERCISE" class="text-danger">EX_STOP</span>
      </button>
    </div>

    <div class="controls">
      <button class="btn btn-sm btn-light"
              @click="togglePlayMode"
              :disabled="playMode === PlayMode.RECORD_EXERCISE">
        <i v-show="playMode === PlayMode.PAUSE" class="fa fa-play" aria-hidden="true"></i>
        <i v-show="playMode === PlayMode.PLAYBACK" class="fa fa-pause" aria-hidden="true"></i>
        <i v-show="playMode === PlayMode.STANDBY" class="fa fa-video-camera" aria-hidden="true"></i>
        <i v-show="playMode.isRecording()" class="fa fa-video-camera text-danger" aria-hidden="true"></i>
      </button>

      <Slider ref="slider"
              class="slider"
              @change="handleSliderChange"
              :color="sliderColor"
              :disabled="playMode.isRecording()"></Slider>

      <div class="ts-display text-secondary">
        {{ tsDisplay }}
      </div>
    </div>
  </div>
</template>

<script>
import ElicastOT, { ElicastNop, ElicastText, ElicastSelection } from '@/elicast/elicast_ot'
import { codemirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/python/python'
import Slider from '@/components/slider'
import RecordSound from './record-sound'
import _ from 'lodash'

class PlayMode {
  static PLAYBACK = new PlayMode('playback')
  static PAUSE = new PlayMode('pause')
  static STANDBY = new PlayMode('standby')
  static RECORD = new PlayMode('record')
  static RECORD_EXERCISE = new PlayMode('record_exercise')

  constructor (name) {
    this.name = name
  }

  toString () {
    return this.name
  }

  isRecording () {
    return [PlayMode.RECORD, PlayMode.RECORD_EXERCISE].includes(this)
  }
}

const EDITOR_OPTIONS = {
  mode: 'python',
  lineNumbers: true,
  cursorBlinkRate: 0, // disable default blinker which is not working in no-focus state
  showCursorWhenSelecting: true,
  autofocus: true
}

const CURSOR_BLINK_RATE = 530 // CodeMirror default cursorBlinkRate: 530ms
const PLAYBACK_TICK = 1000 / 120
const RECORD_TICK = 1000 / 10

const INITIAL_CODE = `def hello(thing):
  print(f"hello, {thing}!")

hello("world")`

export default {
  data () {
    return {
      PlayMode,

      code: INITIAL_CODE,
      ots: [
        new ElicastText(0, 0, 0, INITIAL_CODE, ''),
        new ElicastSelection(1, 0, 0)
      ],
      ts: 0,
      playMode: PlayMode.STANDBY,
      maxTs: 0,
      recordStartOt: null,
      recordExerciseStartOt: null,
      recordSound: new RecordSound('audio/webm'),
      playbackStartTs: -1,
      playbackStartTime: -1,

      cursorBlinkTimer: -1,
      recordTimer: -1,
      playbackTimer: -1
    }
  },

  computed: {
    cm () {
      return this.$refs.cm.editor
    },
    editorOptions () {
      return Object.assign({
        readOnly: this.playMode.isRecording() ? false : 'nocursor'
      }, EDITOR_OPTIONS)
    },
    tsDisplay () {
      const hour = Math.floor(this.ts / 1000 / 60 / 60)
      const min = Math.floor((this.ts / 1000 / 60) % 60)
      const sec = Math.floor((this.ts / 1000) % 60)
      return [hour, [min, String(sec).padStart(2, '0')].join(':')]
        .filter(Boolean).join(':')
    },
    sliderColor () {
      return this.playMode.isRecording() ? 'red' : 'black'
    }
  },

  watch: {
    ots (ots, prevOts) {
      const lastOt = ots[ots.length - 1]
      console.log(lastOt.command, lastOt.ts)

      this.ts = lastOt.ts
    },

    ts (ts, prevTs) {
      if (ts > this.maxTs) {
        this.maxTs = ts
        this.$refs.slider.max = ts
      }
      this.$refs.slider.val = ts

      if (this.playMode.isRecording()) return

      // forward / rewind the document
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
      }
    },

    playMode (playMode, prevPlayMode) {
      if (!prevPlayMode.isRecording() && playMode === PlayMode.RECORD) {
        // start recording
        this.recordSound.record().then(function () {
          const lastTs = this.ots.length ? this.ots[this.ots.length - 1].ts : 0
          this.recordStartOt = new ElicastNop(lastTs)
          this.ots.push(this.recordStartOt)

          if (this.recordTimer !== -1) throw new Error('recordTimer is not cleared')
          this.recordTimer = setInterval(this.recordTick, RECORD_TICK)
        }.bind(this))
      } else if (prevPlayMode === PlayMode.RECORD && !playMode.isRecording()) {
        // end recording
        this.recordSound.stopRecording().then(function () {
          const ts = this.recordStartOt.getRelativeTS()
          this.ots.push(new ElicastNop(ts))
          this.recordStartOt = null

          clearInterval(this.recordTimer)
          this.recordTimer = -1
          this.recordAudioChunks = null
        }.bind(this))
      } else if (prevPlayMode === PlayMode.RECORD && playMode === PlayMode.RECORD_EXERCISE) {
        // start recording exercise
        const ts = this.recordStartOt.getRelativeTS()
        this.recordExerciseStartOt = new ElicastNop(ts)
        this.ots.push(this.recordExerciseStartOt)
      } else if (prevPlayMode === PlayMode.RECORD_EXERCISE && playMode === PlayMode.RECORD) {
        const ts = this.recordStartOt.getRelativeTS()
        const newOt = ElicastOT.makeOTFromExercise(this.ots, this.recordExerciseStartOt, ts)
        this.ots.push(newOt)
        this.recordExerciseStartOt = null
      } else if (playMode === PlayMode.PLAYBACK) {
        // start playback
        if (this.playbackTimer !== -1) throw new Error('playbackTimer is not cleared')

        this.recordSound.load().then(function (sound) {
          sound.seek(this.ts / 1000)
          sound.play()

          this.playbackStartTs = this.ts
          this.playbackStartTime = Date.now()
          this.playbackSound = sound

          const tick = function () {
            this.playbackTick()
            this.playbackTimer = setTimeout(tick, PLAYBACK_TICK)
          }.bind(this)
          this.playbackTimer = setTimeout(tick, PLAYBACK_TICK)
        }.bind(this))

        console.log(JSON.stringify(this.ots))
      } else if (prevPlayMode === PlayMode.PLAYBACK) {
        // pause playback
        this.playbackSound.stop()

        clearTimeout(this.playbackTimer)
        this.playbackTimer = -1
      }
    }
  },

  mounted (t) {
    this.cursorBlinkTimer = setInterval(this.toggleCursorBlink, CURSOR_BLINK_RATE)
  },

  beforeDestroy () {
    clearInterval(this.cursorBlinkTimer)
  },

  methods: {
    onEditorBeforeChange (cm, changeObj) {
      if (!this.playMode.isRecording()) return

      if (!ElicastOT.isChangeAllowed(this.ots, this.recordExerciseStartOt, cm, changeObj)) {
        changeObj.cancel()
        return
      }
      const ts = this.recordStartOt.getRelativeTS()
      const newOt = ElicastOT.makeOTFromCMChange(cm, changeObj, ts)
      this.ots.push(newOt)
    },
    onEditorCursorActivity (cm) {
      if (!this.playMode.isRecording()) return

      const ts = this.recordStartOt.getRelativeTS()
      const newOt = ElicastOT.makeOTFromCMSelection(cm, ts)
      this.ots.push(newOt)
    },
    handleSliderChange (val, isMouseDown) {
      if (isMouseDown) this.playMode = PlayMode.PAUSE
      this.ts = val
    },
    recordTick () {
      this.ts = this.recordStartOt.getRelativeTS()
    },
    playbackTick () {
      let nextTs = this.playbackStartTs + Date.now() - this.playbackStartTime
      if (nextTs > this.maxTs) {
        nextTs = this.maxTs
        this.playMode = PlayMode.PAUSE
      }
      this.ts = nextTs
    },
    toggleCursorBlink () {
      const cmCursor = this.$el.querySelector('.CodeMirror-cursors')
      cmCursor.style.visibility = cmCursor.style.visibility === 'visible' ? 'hidden' : 'visible'
    },
    togglePlayMode () {
      const toggleState = {
        [PlayMode.PLAYBACK]: PlayMode.PAUSE,
        [PlayMode.PAUSE]: PlayMode.PLAYBACK,
        [PlayMode.STANDBY]: PlayMode.RECORD,
        [PlayMode.RECORD]: PlayMode.STANDBY
      }
      this.playMode = toggleState[this.playMode]

      _.defer(this.$refs.slider.layout)
    },
    toggleRecordExercise () {
      const toggleState = {
        [PlayMode.RECORD]: PlayMode.RECORD_EXERCISE,
        [PlayMode.RECORD_EXERCISE]: PlayMode.RECORD
      }
      this.playMode = toggleState[this.playMode]

      _.defer(this.$refs.slider.layout)
    }
  },

  components: {
    codemirror,
    Slider
  }
}
</script>

<style lang="scss">
.editor-wrap {
  position: relative;
  border: 1px solid #eee;

  button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 100;
    cursor: pointer;
  }
}

.controls {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;

  & > * {
    margin: 0 0.25rem;

    &:first-child, &:last-child {
      margin: 0;
    }
  }

  button {
    width: 2.5em;
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
