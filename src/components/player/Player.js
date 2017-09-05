import ElicastOT, { ElicastRecordStart, ElicastSelection,
  ElicastText, ElicastRun, ElicastExercise, ElicastAssert } from '@/elicast/elicast-ot'
import ElicastService from '@/elicast/elicast-service'
import SolveExerciseSession from './solve-exercise-session'
import Slider from '@/components/Slider'
import RunOutputView from '@/components/RunOutputView'
import Toast from '@/components/Toast'
import { codemirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/python/python'
import _ from 'lodash'
import dateFormat from 'date-fns/format'
import SoundManager from '@/components/sound-manager'

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
      type: Object,
      required: true
    }
  },

  data () {
    return {
      PlayMode,

      code: '',
      dirty: false,
      elicastId: this.elicast.id,
      elicastTitle: this.elicast.title,
      solveExerciseSession: null,
      ots: this.elicast.ots,
      ts: -1,
      playMode: PlayMode.PAUSE,
      playModeReady: true,
      maxTs: 0,
      runOutput: null,
      soundManager: new SoundManager('audio/webm', this.elicast.voiceBlobs),
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
      return dateFormat(this.ts, 'm:ss') + ' / ' + dateFormat(this.maxTs, 'm:ss')
    },

    sliderOverlays () {
      const overlayColors = {
        [ElicastExercise]: '#E1BEE7'
      }

      return ElicastOT
        .getSegments(this.ots)
        .filter(segment => segment.type === ElicastExercise)
        .map(segment => ({
          from: segment.fromTs,
          to: segment.toTs,
          color: overlayColors[segment.type]
        }))
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
      let shouldRestartPlaybackSound = false

      this.dirty = this.dirty || Math.abs(newOtIdx - prevOtIdx) > 10

      if (this.dirty) {
        const code = ElicastOT.buildText(this.ots.slice(0, newOtIdx + 1))
        this.cm.setValue(code)
      }

      // prevOtIdx < newOtIdx
      for (let i = prevOtIdx + 1; i <= newOtIdx && i < this.ots.length; i++) {
        const ot = this.ots[i]

        if (ot instanceof ElicastSelection) continue

        if (!this.dirty && ot instanceof ElicastText) {
          ElicastOT.applyOtToCM(this.cm, ot)
        }

        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        } else if (ot instanceof ElicastExercise && !ot._solved) {
          this.playMode = PlayMode.SOLVE_EXERCISE
        } else if (ot instanceof ElicastRecordStart) {
          shouldRestartPlaybackSound = true
        }
      }

      // prevOtIdx > newOtIdx
      for (let i = prevOtIdx; i > newOtIdx && i >= 0; i--) {
        const ot = this.ots[i]

        if (ot instanceof ElicastSelection) continue

        if (!this.dirty && ot instanceof ElicastText) {
          ElicastOT.revertOtToCM(this.cm, ot)
        }

        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        }
      }

      // if playMode is not playback, always redraw when ts changes
      shouldRedrawExerciseAreas = shouldRedrawExerciseAreas || this.dirty
      shouldRedrawRunOutput = shouldRedrawRunOutput || this.dirty
      shouldRestartPlaybackSound = shouldRestartPlaybackSound && this.playMode === PlayMode.PLAYBACK

      // restore exercise areas
      if (shouldRedrawExerciseAreas) {
        ElicastOT.redrawExerciseAreas(this.cm, this.ots.slice(0, newOtIdx + 1))
      }

      // restore run output
      if (shouldRedrawRunOutput) {
        this.redrawRunOutput()
      }

      if (shouldRestartPlaybackSound) {
        this.restartPlaybackSound()
      }

      // restore selection
      this.redrawSelection()

      this.dirty = false

      if (ts === this.$refs.slider.max) {
        this.playMode = PlayMode.PAUSE
      }
    },

    async playMode (playMode, prevPlayMode) {
      if (playMode === PlayMode.PLAYBACK) {
        // start playback
        if (this.playbackTimer !== -1) throw new Error('playbackTimer is not cleared')

        if (this.ts === this.maxTs) {
          // replay from the beginning
          this.ts = 0
        }

        await this.restartPlaybackSound()

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

      if (playMode === PlayMode.SOLVE_EXERCISE) {
        if (_.isNil(this.solveExerciseSession)) {
          const exerciseStartOt = _.findLast(this.ots,
            ot => ot.ts <= this.ts && ot instanceof ElicastExercise)
          this.solveExerciseSession = new SolveExerciseSession(this.ots, exerciseStartOt)
          this.solveExerciseSession.start()
        }

        // restore code
        const code = ElicastOT.buildText(this.ots.slice(0, this.solveExerciseSession.exerciseStartIndex))
        this.cm.setValue(code)

        // restore selection to right before text change
        const previousSelectionOt = ElicastOT.getLastOtForOtType(
          this.ots, ElicastSelection, this.solveExerciseSession.exerciseStartOt.ts)
        if (previousSelectionOt) ElicastOT.applyOtToCM(this.cm, previousSelectionOt)

        _.defer(() => { this.$el.querySelector('.CodeMirror-scroll').scrollTop += 100 })

        this.solveExerciseSession.solveOts
          .filter(ot => ot instanceof ElicastText)
          .forEach(ot => ElicastOT.applyOtToCM(this.cm, ot))

        ElicastOT.redrawSolveExerciseArea(this.cm, this.solveExerciseSession.solveOts)
        this.dirty = true
      }

      _.defer(() => {
        if (playMode === PlayMode.SOLVE_EXERCISE) this.cm.focus()
        else this.$refs.controlButton.focus()
      })

      this.playModeReady = true
    }
  },

  created () {
    this.soundManager.preload()
  },

  mounted () {
    this.cursorBlinkTimer = setInterval(this.toggleCursorBlink, CURSOR_BLINK_RATE)

    this.cm = this.$refs.cm.editor
    this.cm.on('mousedown', this.handleEditorMousedown)
    window.addEventListener('resize', this.handleEditorResize)
    this.handleEditorResize()

    if (!this.ots.length) {
      this.maxTs = 0
    } else {
      let assertIdx = this.ots.findIndex(ot => ot instanceof ElicastAssert)
      this.maxTs = assertIdx < 0 ? this.ots[this.ots.length - 1].ts : this.ots[assertIdx - 1].ts
    }
    this.ts = 0
  },

  beforeDestroy () {
    // stop sound if playing
    if (!_.isNull(this.playbackSound)) {
      this.playbackSound.stop()
      this.playbackSound = null
    }

    clearInterval(this.cursorBlinkTimer)
    window.removeEventListener('resize', this.handleEditorResize)
  },

  methods: {
    redrawSelection () {
      const previousSelectionOt = ElicastOT.getLastOtForOtType(this.ots, ElicastSelection, this.ts)
      if (previousSelectionOt) ElicastOT.applyOtToCM(this.cm, previousSelectionOt)
    },
    redrawRunOutput (runOt) {
      runOt = runOt || ElicastOT.getLastOtForOtType(this.ots, ElicastRun, this.ts)
      if (runOt) {
        this.runOutput = runOt.isRunning() ? '/* running... */' : runOt.output
      } else {
        this.runOutput = ''
      }
    },
    async restartPlaybackSound () {
      if (!_.isNull(this.playbackSound)) {
        this.playbackSound.stop()
        this.playbackSound = null
      }

      const lastRecordStartOt = ElicastOT.getLastOtForOtType(this.ots, ElicastRecordStart, this.ts)
      this.playbackSound = await this.soundManager.load(lastRecordStartOt.soundChunkIdx)
      this.playbackSound.seek((this.ts - lastRecordStartOt.ts) / 1000)
      this.playbackSound.play()
    },
    async runCode () {
      const runStartOT = new ElicastRun(0)
      this.redrawRunOutput(runStartOT)
      this.playModeReady = false

      const toast = this.$refs.toast.show({
        class: ['alert', 'alert-warning'],
        content: '<i class="fa fa-terminal"></i> Running...'
      })

      const [exitCode, output] = await ElicastService.runCode(this.code)

      const runResultOT = new ElicastRun(0, exitCode, output)
      this.redrawRunOutput(runResultOT)
      this.playModeReady = true

      this.$refs.toast.remove(toast)
    },
    async checkAnswer () {
      const session = this.solveExerciseSession

      const mockOts = this.ots.map(ot => ot.clone())
      const solutionOtsLength = (session.exerciseEndIndex - 1) - (session.exerciseStartIndex + 1) + 1
      ElicastOT.replacePartialOts(mockOts, session.exerciseStartIndex + 1, solutionOtsLength, session.solveOts)

      const checkAnswerToast = this.$refs.toast.show({
        class: ['alert', 'alert-warning'],
        content: '<i class="fa fa-check"></i> Checking answer...'
      })

      const solveCode = ElicastOT.buildText(mockOts)
      const exitCode = await ElicastService.checkAnswer(this.elicastId, session.exId, session.solveOts, solveCode)

      this.$refs.toast.remove(checkAnswerToast)

      if (exitCode === 0) {
        ElicastOT.replacePartialOts(this.ots, session.exerciseStartIndex + 1, solutionOtsLength, session.solveOts)

        this.solveExerciseSession.finish()

        this.playMode = PlayMode.PLAYBACK

        this.ts = this.solveExerciseSession.exerciseEndOt.ts
        this.solveExerciseSession = null

        this.$refs.toast.show({
          class: ['alert', 'alert-success'],
          content: 'Correct!',
          lifespan: 2000
        })
      } else {
        this.$refs.toast.show({
          class: ['alert', 'alert-danger'],
          content: 'Wrong answer, please try again!',
          lifespan: 2000
        })
      }
    },
    skipExercise () {
      this.solveExerciseSession.finish()
      this.playMode = PlayMode.PLAYBACK
      this.solveExerciseSession = null
    },
    handleEditorResize (e) {
      this.cm.setSize(null, document.documentElement.clientHeight - 200)
    },
    handleEditorBeforeChange (cm, changeObj) {
      if (this.playMode !== PlayMode.SOLVE_EXERCISE) return
      if (!changeObj.origin || changeObj.origin === 'setValue') return // ignore restoring solveOts

      if (!ElicastOT.isChangeAllowedForSolveExercise(this.ots, this.solveExerciseSession, cm, changeObj)) {
        console.warn('Editing non-editable area')
        changeObj.cancel()
        return
      }

      const ts = this.solveExerciseSession.getTs()
      const newOT = ElicastOT.makeOTFromCMChange(cm, changeObj, ts)
      this.solveExerciseSession.pushSolveOt(newOT)
    },
    handleEditorChange (cm, changeObj) {
      if (!changeObj.origin || changeObj.origin === 'setValue') return

      this.dirty = true

      if (this.playMode === PlayMode.SOLVE_EXERCISE) {
        ElicastOT.redrawSolveExerciseArea(this.cm, this.solveExerciseSession.solveOts)
      }
    },
    handleEditorBeforeSelectionChange (cm, obj) {
      if (!obj.origin || obj.origin === 'setValue') return

      this.dirty = true
    },
    handleEditorMousedown (event) {
      if (this.playMode === PlayMode.PLAYBACK) {
        this.togglePlayMode()
      }
    },
    handleSliderChange (val, isMouseDown) {
      if (val === this.ts) return

      if (val > this.ts) {
        if (this.playMode === PlayMode.SOLVE_EXERCISE) {
          // cannot move forward when solving exercise
          this.$refs.slider.val = this.ts
          return
        }

        let prevOtIdx = this.ots.findIndex(ot => this.ts < ot.ts)
        prevOtIdx = (prevOtIdx < 0 ? this.ots.length : prevOtIdx) - 1
        let newOtIdx = this.ots.findIndex(ot => val < ot.ts)
        newOtIdx = (newOtIdx < 0 ? this.ots.length : newOtIdx) - 1

        for (let i = prevOtIdx; i <= newOtIdx; i++) {
          const ot = this.ots[i]
          if (ot instanceof ElicastExercise && !ot._solved) {
            this.playMode = PlayMode.SOLVE_EXERCISE
            this.ts = ot.ts
            this.$refs.slider.val = ot.ts
            return
          }
        }
      }

      if (isMouseDown) {
        this.playMode = PlayMode.PAUSE
      }
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
    toggleCursorBlink () {
      const cmCursor = this.$el.querySelector('.CodeMirror-cursors')
      cmCursor.style.visibility = cmCursor.style.visibility === 'visible' ? 'hidden' : 'visible'
    },
    togglePlayMode () {
      if (!this.playModeReady) return

      const toggleState = {
        [PlayMode.PLAYBACK]: PlayMode.PAUSE,
        [PlayMode.PAUSE]: PlayMode.PLAYBACK
      }
      this.playMode = toggleState[this.playMode]
      this.playModeReady = false

      _.defer(this.$refs.slider.layout)
    }

  },

  components: {
    codemirror,
    Slider,
    RunOutputView,
    Toast
  }
}
