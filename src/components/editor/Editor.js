import ElicastOT, { ElicastNop, ElicastSelection, ElicastText, ElicastRun, ElicastAssert } from '@/elicast/elicast-ot'
import Elicast from '@/elicast/elicast'
import RecordExerciseSession from './record-exercise-session'
import RecordAssertSession from './record-assert-session'
import RecordSound from './record-sound'
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
  static STANDBY = new PlayMode('standby')
  static STANDBY_ASSERT = new PlayMode('standby_assert')
  static RECORD = new PlayMode('record')
  static RECORD_EXERCISE = new PlayMode('record_exercise')
  static ASSERT = new PlayMode('assert')

  constructor (name) {
    this.name = name
  }

  toString () {
    return this.name
  }

  isRecording () {
    return [PlayMode.RECORD, PlayMode.RECORD_EXERCISE, PlayMode.ASSERT].includes(this)
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
const RECORD_TICK = 1000 / 10

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
      playMode: PlayMode.STANDBY,
      playModeReady: true,
      maxTs: 0,
      recordStartOt: null,
      recordExerciseSession: null,
      recordAssertSession: null,
      recordSound: new RecordSound('audio/webm', this.elicast ? this.elicast.voiceBlob : null),
      runOutput: null,
      playbackSound: null,
      playbackStartTs: -1,
      playbackStartTime: -1,

      cursorBlinkTimer: -1,
      recordTimer: -1,
      playbackTimer: -1,

      cm: null
    }
  },

  computed: {
    editorOptions () {
      return Object.assign({
        readOnly: this.playMode.isRecording() ? false : 'nocursor'
      }, EDITOR_OPTIONS)
    },
    recordExerciseInitiated () {
      // TODO initiate with removal
      return this.playMode === PlayMode.RECORD_EXERCISE &&
        this.recordExerciseSession.isInitiated()
    },
    recordAssertInitiated () {
      return this.playMode === PlayMode.ASSERT &&
        this.recordAssertSession.isInitiated()
    },
    tsDisplay () {
      // TODO use moment.js
      const hour = Math.floor(this.ts / 1000 / 60 / 60)
      const min = Math.floor((this.ts / 1000 / 60) % 60)
      const sec = Math.floor((this.ts / 1000) % 60)
      return [hour, [min, String(sec).padStart(2, '0')].join(':')]
        .filter(Boolean).join(':')
    },
    sliderColor () {
      return this.playMode.isRecording() ? 'red' : 'black'
    },
    currentElicast () {
      return new Elicast(this.elicastId, this.elicastTitle, this.ots, this.recordSound.recordedBlob)
    }
  },

  watch: {
    ots (ots) {
      const lastOt = ots[ots.length - 1]
      this.ts = lastOt.ts
    },

    ts (ts, prevTs) {
      if (ts > this.maxTs) {
        this.maxTs = ts
      }
      this.$refs.slider.val = ts

      // while recording, changes are directly made in the editor
      if (this.playMode.isRecording()) return

      // forward / rewind the document
      let prevOtIdx = this.ots.findIndex(ot => prevTs < ot.ts)
      prevOtIdx = (prevOtIdx < 0 ? this.ots.length : prevOtIdx) - 1
      let newOtIdx = this.ots.findIndex(ot => ts < ot.ts)
      newOtIdx = (newOtIdx < 0 ? this.ots.length : newOtIdx) - 1

      let shouldRedrawExerciseAreas = false
      let shouldRedrawAssertAreas = false
      let shouldRedrawRunOutput = false

      // prevOtIdx < newOtIdx
      for (let i = prevOtIdx + 1; i <= newOtIdx && i < this.ots.length; i++) {
        const ot = this.ots[i]
        ElicastOT.applyOtToCM(this.cm, ot)
        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastText && ot._assert) {
          shouldRedrawAssertAreas = true
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
        } else if (ot instanceof ElicastText && ot._assert) {
          shouldRedrawAssertAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        }
      }

      // if playMode is not playback, always redraw when ts changes
      shouldRedrawExerciseAreas = shouldRedrawExerciseAreas || this.playMode !== PlayMode.PLAYBACK
      shouldRedrawRunOutput = shouldRedrawRunOutput || this.playMode !== PlayMode.PLAYBACK

      // restore exercise areas
      if (shouldRedrawExerciseAreas) {
        ElicastOT.redrawExerciseAreas(this.cm, this.ots.slice(0, newOtIdx + 1))
      }

      // restore assert areas
      if (shouldRedrawAssertAreas) {
        ElicastOT.redrawAssertAreas(this.cm, this.ots.slice(0, newOtIdx + 1))
      }

      // restore run output
      if (shouldRedrawRunOutput) {
        this.redrawRunOutput()
      }

      // restore selection
      this.redrawSelection()
      if (ts === this.maxTs) {
        // FIXME: make below loop into true/false global status
        this.playMode = this.ots.findIndex(ot => ot instanceof ElicastAssert) === -1
          ? PlayMode.STANDBY : PlayMode.STANDBY_ASSERT
      }
    },

    async playMode (playMode, prevPlayMode) {
      if (!prevPlayMode.isRecording() && playMode === PlayMode.RECORD) {
        // start recording
        await this.recordSound.record()

        // the last OT is a 'nop' OT marking the end of the last recording
        const lastTs = this.ots.length ? this.ots[this.ots.length - 1].ts : 0
        this.recordStartOt = new ElicastNop(lastTs)
        this.ots.push(this.recordStartOt)

        if (this.recordTimer !== -1) throw new Error('recordTimer is not cleared')
        this.recordTimer = setInterval(this.recordTick, RECORD_TICK)
      } else if (prevPlayMode === PlayMode.RECORD && !playMode.isRecording()) {
        // end recording
        await this.recordSound.stopRecording()

        const ts = this.recordStartOt.getRelativeTS()
        this.ots.push(new ElicastNop(ts))
        this.recordStartOt = null

        clearInterval(this.recordTimer)
        this.recordTimer = -1
        this.recordAudioChunks = null
      } else if (prevPlayMode === PlayMode.RECORD && playMode === PlayMode.RECORD_EXERCISE) {
        // start recording exercise
        this.recordExerciseSession = new RecordExerciseSession(this.ots)
        const ts = this.recordStartOt.getRelativeTS()
        this.recordExerciseSession.startRecording(ts)
      } else if (prevPlayMode === PlayMode.RECORD_EXERCISE && playMode === PlayMode.RECORD) {
        // end recording exercise
        const ts = this.recordStartOt.getRelativeTS()
        this.recordExerciseSession.finishRecording(ts)
        this.recordExerciseSession = null

        ElicastOT.redrawExerciseAreas(this.cm, this.ots)
        ElicastOT.clearRecordingExerciseArea(this.cm)
      } else if (playMode === PlayMode.ASSERT) {
        // start recording assert
        this.recordAssertSession = new RecordAssertSession(this.ots)
        const lastTs = this.ots.length ? this.ots[this.ots.length - 1].ts : 0
        this.recordStartOt = this.recordAssertSession.startRecording(lastTs)

        await this.recordSound.record()
        if (this.recordTimer !== -1) throw new Error('recordTimer is not cleared')
        this.recordTimer = setInterval(this.recordTick, RECORD_TICK)
      } else if (prevPlayMode === PlayMode.ASSERT && playMode === PlayMode.STANDBY_ASSERT) {
        // end recording assert
        const ts = this.recordStartOt.getRelativeTS()
        this.recordAssertSession.finishRecording(ts)
        this.recordAssertSession = null

        await this.recordSound.stopRecording()
        this.recordStartOt = null
        clearInterval(this.recordTimer)
        this.recordTimer = -1
        this.recordAudioChunks = null
        ElicastOT.redrawAssertAreas(this.cm, this.ots)
        ElicastOT.clearRecordingAssertArea(this.cm)
      } else if (playMode === PlayMode.PLAYBACK) {
        // start playback
        if (this.playbackTimer !== -1) throw new Error('playbackTimer is not cleared')

        // restore selection
        this.redrawSelection()
        // restore run output
        this.redrawRunOutput()

        this.playbackSound = await this.recordSound.load()
        this.playbackSound.seek(this.ts / 1000)
        this.playbackSound.play()

        this.playbackStartTs = this.ts
        this.playbackStartTime = Date.now()

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

      // Give focus to the editor if new playMode is a recording state,
      // otherwise give focus to the control button
      _.defer(() => {
        if (playMode.isRecording()) this.cm.focus()
        else this.$refs.controlButton.focus()
      })

      this.playModeReady = true
    }
  },

  mounted (t) {
    this.cursorBlinkTimer = setInterval(this.toggleCursorBlink, CURSOR_BLINK_RATE)

    this.cm = this.$refs.cm.editor
    this.cm.on('mousedown', this.handleEditorMousedown)

    this.ts = this.ots.length && this.ots[this.ots.length - 1].ts
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
      return runResultOT.exitCode
    },
    cutOts () {
      const firstCutOtIdx = this.ots.findIndex(ot => this.ts < ot.ts)
      if (firstCutOtIdx <= 0) return

      const lastAppliedOt = this.ots[firstCutOtIdx - 1]

      if (!_.isUndefined(lastAppliedOt._exId)) return  // Not allow "In exercise" state

      this.maxTs = this.ts
      this.ots.splice(firstCutOtIdx, this.ots.length - firstCutOtIdx)

      this.ots.push(new ElicastNop(this.ts + 1))  // Trick to invoke ts update
      this.ts += 1
    },
    handleEditorBeforeChange (cm, changeObj) {
      if (!this.playMode.isRecording()) return

      if (!ElicastOT.isChangeAllowed(this.ots, this.recordExerciseSession, cm, changeObj)) {
        console.warn('Editing non-editable area')
        changeObj.cancel()
        return
      }
      const ts = this.recordStartOt.getRelativeTS()
      const newOT = ElicastOT.makeOTFromCMChange(cm, changeObj, ts)
      this.ots.push(newOT)
    },
    handleEditorChange (cm, changeObj) {
      if (!this.playMode.isRecording()) return

      if (this.recordExerciseInitiated) {
        ElicastOT.redrawRecordingExerciseArea(this.cm,
          this.recordExerciseSession.getExerciseOTs())
      } else if (this.recordAssertInitiated) {
        ElicastOT.redrawRecordingAssertArea(this.cm,
          this.recordAssertSession.getAssertOTs())
      }
    },
    handleEditorCursorActivity (cm) {
      if (!this.playMode.isRecording()) return

      const ts = this.recordStartOt.getRelativeTS()
      const newOT = ElicastOT.makeOTFromCMSelection(cm, ts)
      this.ots.push(newOT)
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
      if (!this.playModeReady) return

      const toggleState = {
        [PlayMode.PLAYBACK]: PlayMode.PAUSE,
        [PlayMode.PAUSE]: PlayMode.PLAYBACK,
        [PlayMode.STANDBY]: PlayMode.RECORD,
        [PlayMode.RECORD]: PlayMode.STANDBY
      }
      this.playMode = toggleState[this.playMode]
      this.playModeReady = false

      _.defer(this.$refs.slider.layout)
    },
    toggleRecordExercise () {
      if (!this.playModeReady) return

      const toggleState = {
        [PlayMode.RECORD]: PlayMode.RECORD_EXERCISE,
        [PlayMode.RECORD_EXERCISE]: PlayMode.RECORD
      }
      this.playMode = toggleState[this.playMode]
      this.playModeReady = false

      _.defer(this.$refs.slider.layout)
    },
    async toggleRecordAssert () {
      if (!this.playModeReady) return

      if (this.playMode === PlayMode.ASSERT) {
        let exitCode = await this.runCode()
        if (exitCode !== 0) {
          alert('Assertion Failed.')
          return
        }
      }

      const toggleState = {
        [PlayMode.ASSERT]: PlayMode.STANDBY_ASSERT,
        [PlayMode.STANDBY_ASSERT]: PlayMode.ASSERT,
        [PlayMode.STANDBY]: PlayMode.ASSERT
      }
      this.playMode = toggleState[this.playMode]
      this.playModeReady = false

      _.defer(this.$refs.slider.layout)
    }
  },

  components: {
    codemirror,
    Slider,
    RunOutputView
  }
}
