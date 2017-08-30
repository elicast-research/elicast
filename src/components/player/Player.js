import ElicastOT, { ElicastText, ElicastSelection, ElicastRun } from '@/elicast/elicast-ot'
import Slider from '@/components/Slider'
import RunOutputView from '@/components/RunOutputView'
import { codemirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/python/python'
import _ from 'lodash'
import axios from 'axios'
import qs from 'qs'

class PlayMode {
  static PLAYBACK = new PlayMode('playback')
  static PAUSE = new PlayMode('pause')
  static SOLVE_EXERCISE = new PlayMode('solve_exercise')

  constructor (name) {
    this.name = name
  }

  toString () {
    return this.name
  }
}

const EDITOR_OPTIONS = {
  mode: 'python',
  theme: 'solarized',
  lineNumbers: true,
  cursorBlinkRate: 0, // disable default blinker which is not working in no-focus state
  showCursorWhenSelecting: true,
  autofocus: true
}

const CURSOR_BLINK_RATE = 530 // CodeMirror default cursorBlinkRate: 530ms
const PLAYBACK_TICK = 1000 / 120

export default {
  props: {
    elicast: {
      type: Object
    }
  },

  data () {
    return {
      PlayMode,

      code: '',
      elicastId: this.elicast ? this.elicast.id : null,
      elicastTitle: this.elicast ? this.elicast.title : 'Untitiled',
      ots: this.elicast ? this.elicast.ots : [],
      ts: -1,
      playMode: PlayMode.PAUSE,
      playModeReady: true,
      maxTs: 0,
      runOutput: null,
      playbackSound: null,
      playbackStartTs: -1,
      playbackStartTime: -1,

      cursorBlinkTimer: -1,
      playbackTimer: -1,

      cm: null
    }
  },

  computed: {
    editorOptions () {
      return EDITOR_OPTIONS
    },

    tsDisplay () {
      // TODO use moment.js
    }
  },

  watch: {
    ts (ts, prevTs) {
      if (ts > this.maxTs) {
        this.maxTs = ts
        this.$refs.slider.max = ts
      }
      this.$refs.slider.val = ts

      // forward / rewind the document
      let prevOtIdx = this.ots.findIndex(ot => prevTs < ot.ts)
      prevOtIdx = (prevOtIdx < 0 ? this.ots.length : prevOtIdx) - 1
      let newOtIdx = this.ots.findIndex(ot => ts < ot.ts)
      newOtIdx = (newOtIdx < 0 ? this.ots.length : newOtIdx) - 1

      let shouldRedrawExerciseAreas = false
      let shouldRedrawRunOutput = false

      // prevOtIdx < newOtIdx
      for (let i = prevOtIdx + 1; i <= newOtIdx && i < this.ots.length; i++) {
        const ot = this.ots[i]
        ElicastOT.applyOtToCM(this.cm, ot)
        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        }
      }
      // prevOtIdx > newOtIdx
      for (let i = prevOtIdx; i > newOtIdx && i >= 0; i--) {
        const ot = this.ots[i]
        ElicastOT.revertOtToCM(this.cm, ot)
        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        }
      }

      // restore exercise areas
      if (shouldRedrawExerciseAreas) {
        ElicastOT.redrawExerciseAreas(this.cm, this.ots.slice(0, newOtIdx + 1))
      }

      // restore run output
      if (shouldRedrawRunOutput) {
        this.redrawRunOutput()
      }

      // restore selection
      this.redrawSelection()

      if (ts === this.$refs.slider.max) {
        this.playMode = PlayMode.PAUSE
      }
    },

    async playMode (playMode, prevPlayMode) {
      if (playMode === PlayMode.PLAYBACK) {
        // start playback
        if (this.playbackTimer !== -1) throw new Error('playbackTimer is not cleared')

        this.playbackSound = await this.recordSound.load()
        this.playbackSound.seek(this.ts / 1000)
        this.playbackSound.play()

        this.playbackStartTs = this.ts
        this.playbackStartTime = Date.now()

        // restore selection
        this.redrawSelection()

        const tick = () => {
          this.playbackTick()
          this.playbackTimer = setTimeout(tick, PLAYBACK_TICK)
        }
        this.playbackTimer = setTimeout(tick, PLAYBACK_TICK)
      } else if (prevPlayMode === PlayMode.PLAYBACK) {
        // pause playback

        this.playbackSound.stop()
        this.playbackSound = null

        this.playbackStartTs = -1
        this.playStartTime = -1

        clearTimeout(this.playbackTimer)
        this.playbackTimer = -1
      }

      // Give focus to the editor if new playMode is SOLVE_EXERCISE state,
      // otherwise give focus to the control button
      _.defer(() => {
        if (playMode.isRecording()) this.cm.focus()
        else this.$refs.controlButton.focus()
      })

      this.playModeReady = true
    }
  },

  mounted () {
    this.cursorBlinkTimer = setInterval(this.toggleCursorBlink, CURSOR_BLINK_RATE)

    this.cm = this.$refs.cm.editor
    this.cm.on('mousedown', this.handleEditorMousedown)

    this.ts = 0
  },

  beforeDestroy () {
    clearInterval(this.cursorBlinkTimer)
  },

  methods: {
    redrawSelection () {
      const previousSelectionOt = ElicastOT.getPreviousOtForOtType(this.ots, ElicastSelection, this.ts)
      if (previousSelectionOt) ElicastOT.applyOtToCM(this.cm, previousSelectionOt)
    },
    redrawRunOutput (runOt) {
      runOt = runOt || ElicastOT.getPreviousOtForOtType(this.ots, ElicastRun, this.ts)
      if (runOt) {
        this.runOutput = runOt.output || '/* running... */'
      } else {
        this.runOutput = ''
      }
    },
    async runCode () {
      let ts = this.recordStartOt.getRelativeTS()
      const runStartOT = new ElicastRun(ts)
      this.ots.push(runStartOT)
      this.redrawRunOutput(runStartOT)

      const response = await axios.post('http://anne.pjknkda.com:7822/code/run', qs.stringify({
        code: this.code
      }))

      ts = this.recordStartOt.getRelativeTS()
      const runResultOT = new ElicastRun(ts, response.data.exit_code, response.data.output)
      this.ots.push(runResultOT)
      this.redrawRunOutput(runResultOT)
    },
    handleEditorMousedown (event) {
      if (this.playMode === PlayMode.PLAYBACK) {
        this.togglePlayMode()
      }
    },
    handleSliderChange (val, isMouseDown) {
      if (isMouseDown) this.playMode = PlayMode.PAUSE
      this.ts = val
    },
    playbackTick () {
      let nextTs = this.playbackStartTs + Date.now() - this.playbackStartTime
      if (nextTs > this.maxTs) {
        nextTs = this.maxTs
        this.playMode = PlayMode.PAUSE
      }
      this.ts = nextTs
    },
    togglePlayMode () {
      if (!this.playModeReady) return

      const toggleState = {
        [PlayMode.PLAYBACK]: PlayMode.PAUSE,
        [PlayMode.PAUSE]: PlayMode.PLAYBACK,
      }
      this.playMode = toggleState[this.playMode]
      this.playModeReady = false

      _.defer(this.$refs.slider.layout)
    },

  },

  components: {
    codemirror,
    Slider,
    RunOutputView
  }
}
