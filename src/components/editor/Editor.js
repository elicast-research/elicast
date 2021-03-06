import ElicastOT, { ElicastRecordStart, ElicastRecordEnd, ElicastSelection,
  ElicastText, ElicastExercise, ElicastRun, ElicastAssert } from '@/elicast/elicast-ot'
import Elicast from '@/elicast/elicast'
import ElicastService from '@/elicast/elicast-service'
import RecordExerciseSession from './record-exercise-session'
import RecordAssertSession from './record-assert-session'
import SoundManager from '@/components/sound-manager'
import Slider from '@/components/Slider'
import RunOutputView from '@/components/RunOutputView'
import Toast from '@/components/Toast'
import { codemirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/python/python'
import _ from 'lodash'
import dateFormat from 'date-fns/format'

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

class PlayAreaType {
  static TEXT = new PlayAreaType('text')
  static EXERCISE = new PlayAreaType('exercise')
  static ASSERT = new PlayAreaType('assert')

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
  indentWithTabs: false,
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
      PlayAreaType,

      code: '',
      elicastId: this.elicast ? this.elicast.id : null,
      elicastTitle: this.elicast ? this.elicast.title : 'Untitiled',
      ots: this.elicast ? this.elicast.ots : [],
      ts: -1,
      playMode: PlayMode.STANDBY,
      playAreaType: PlayAreaType.TEXT,
      playModeReady: true,
      maxTs: 0,
      recordStartOt: null,
      recordExerciseSession: null,
      recordAssertSession: null,
      soundManager: new SoundManager('audio/webm', this.elicast ? this.elicast.voiceBlobs : null),
      runOutput: null,
      playbackSound: null,
      playbackStartTs: -1,
      playbackStartTime: -1,

      cursorBlinkTimer: -1,
      recordTimer: -1,
      playbackTimer: -1,

      cm: null,
      logger: null
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
      return this.playMode === PlayMode.ASSERT
    },
    tsDisplay () {
      return dateFormat(this.ts, 'm:ss') + ' / ' + dateFormat(this.maxTs, 'm:ss')
    },
    sliderColor () {
      return this.playMode.isRecording() ? 'red' : 'black'
    },
    sliderOverlays () {
      const overlayColors = {
        [ElicastExercise]: '#E1BEE7',
        [ElicastAssert]: '#FFCDD2'
      }

      return ElicastOT
        .getSegments(this.ots)
        .map(segment => ({
          from: segment.fromTs,
          to: segment.toTs,
          color: overlayColors[segment.type]
        }))
    },
    currentElicast () {
      return new Elicast(this.elicastId, this.elicastTitle, this.ots, this.soundManager.chunks)
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

      if (prevOtIdx === newOtIdx) return

      let shouldRedrawExerciseAreas = false
      let shouldRedrawAssertAreas = false
      let shouldRedrawRunOutput = false
      let shouldRestartPlaybackSound = false

      const isBigJump = Math.abs(newOtIdx - prevOtIdx) > 10

      if (isBigJump) {
        this.cm.setValue(ElicastOT.buildText(this.ots.slice(0, newOtIdx + 1)))
      }

      // prevOtIdx < newOtIdx
      for (let i = prevOtIdx + 1; i <= newOtIdx && i < this.ots.length; i++) {
        const ot = this.ots[i]

        if (ot instanceof ElicastSelection) continue

        if (!(isBigJump && ot instanceof ElicastText)) {
          ElicastOT.applyOtToCM(this.cm, ot)
        }

        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastText && ot._assert) {
          shouldRedrawAssertAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        } else if (ot instanceof ElicastExercise) {
          this.playAreaType = this.playAreaType === PlayAreaType.TEXT
            ? PlayAreaType.EXERCISE : PlayAreaType.TEXT
        } else if (ot instanceof ElicastAssert) {
          this.playAreaType = this.playAreaType === PlayAreaType.TEXT
            ? PlayAreaType.ASSERT : PlayAreaType.TEXT
        } else if (ot instanceof ElicastRecordStart) {
          shouldRestartPlaybackSound = true
        }
      }
      // prevOtIdx > newOtIdx
      for (let i = prevOtIdx; i > newOtIdx && i >= 0; i--) {
        const ot = this.ots[i]

        if (ot instanceof ElicastSelection) continue

        if (!(isBigJump && ot instanceof ElicastText)) {
          ElicastOT.revertOtToCM(this.cm, ot)
        }

        if (ot instanceof ElicastText && ot._exId) {
          shouldRedrawExerciseAreas = true
        } else if (ot instanceof ElicastText && ot._assert) {
          shouldRedrawAssertAreas = true
        } else if (ot instanceof ElicastRun) {
          shouldRedrawRunOutput = true
        } else if (ot instanceof ElicastExercise) {
          this.playAreaType = this.playAreaType === PlayAreaType.TEXT
            ? PlayAreaType.EXERCISE : PlayAreaType.TEXT
        } else if (ot instanceof ElicastAssert) {
          this.playAreaType = this.playAreaType === PlayAreaType.TEXT
            ? PlayAreaType.ASSERT : PlayAreaType.TEXT
        }
      }

      // if playMode is not playback, always redraw when ts changes
      shouldRedrawExerciseAreas = shouldRedrawExerciseAreas || this.playMode !== PlayMode.PLAYBACK
      shouldRedrawRunOutput = shouldRedrawRunOutput || this.playMode !== PlayMode.PLAYBACK
      shouldRestartPlaybackSound = shouldRestartPlaybackSound && this.playMode === PlayMode.PLAYBACK

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

      if (shouldRestartPlaybackSound) {
        this.restartPlaybackSound()
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
      this.logger.submit('watch-play-mode', {
        'id': this.elicastId,
        'prev': prevPlayMode,
        'next': playMode,
        'ts': this.ts
      })

      if (!prevPlayMode.isRecording() && playMode === PlayMode.RECORD) {
        // start recording
        const soundChunkIdx = await this.soundManager.record()

        // the last OT is a 'nop' OT marking the end of the last recording
        const lastTs = this.ots.length ? this.ots[this.ots.length - 1].ts : 0
        this.recordStartOt = new ElicastRecordStart(lastTs, soundChunkIdx)
        this.ots.push(this.recordStartOt)

        if (this.recordTimer !== -1) throw new Error('recordTimer is not cleared')
        this.recordTimer = setInterval(this.recordTick, RECORD_TICK)
      } else if (prevPlayMode === PlayMode.RECORD && !playMode.isRecording()) {
        // end recording
        await this.soundManager.stopRecording()

        const ts = this.recordStartOt.getRelativeTS()
        this.ots.push(new ElicastRecordEnd(ts))
        this.recordStartOt = null

        clearInterval(this.recordTimer)
        this.recordTimer = -1
      } else if (prevPlayMode === PlayMode.RECORD && playMode === PlayMode.RECORD_EXERCISE) {
        // start recording exercise
        const lastExerciseOt = ElicastOT.getLastOtForOtType(this.ots, ElicastExercise)
        const newExId = lastExerciseOt ? lastExerciseOt.exId + 1 : 1

        this.recordExerciseSession = new RecordExerciseSession(this.ots, newExId)
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

        if (this.recordTimer !== -1) throw new Error('recordTimer is not cleared')
        this.recordTimer = setInterval(this.recordTick, RECORD_TICK)
      } else if (prevPlayMode === PlayMode.ASSERT && playMode === PlayMode.STANDBY_ASSERT) {
        // end recording assert
        const ts = this.recordStartOt.getRelativeTS()
        this.recordAssertSession.finishRecording(ts)
        this.recordAssertSession = null

        this.recordStartOt = null
        clearInterval(this.recordTimer)
        this.recordTimer = -1

        ElicastOT.redrawAssertAreas(this.cm, this.ots)
        ElicastOT.clearRecordingAssertArea(this.cm)
      } else if (playMode === PlayMode.PLAYBACK) {
        // start playback
        if (this.playbackTimer !== -1) throw new Error('playbackTimer is not cleared')

        // restore selection
        this.redrawSelection()
        // restore run output
        this.redrawRunOutput()

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

      // Give focus to the editor if new playMode is a recording state,
      // otherwise give focus to the control button
      _.defer(() => {
        if (playMode.isRecording()) this.cm.focus()
        else this.$refs.controlButton.focus()
      })

      this.playModeReady = true
    }
  },

  created () {
    this.soundManager.preload()
  },

  mounted (t) {
    this.logger = this.$logger.getLogger('Editor')

    this.cursorBlinkTimer = this.cursorBlinkTick()

    this.cm = this.$refs.cm.editor
    this.cm.on('mousedown', this.handleEditorMousedown)
    window.addEventListener('resize', this.handleEditorResize)
    this.handleEditorResize()

    this.ts = this.ots.length && this.ots[this.ots.length - 1].ts

    window.onbeforeunload = () =>
      'Do you want to leave this page? Changes you made may not be saved.'
  },

  beforeDestroy () {
    // stop sound if playing
    if (!_.isNull(this.playbackSound)) {
      this.playbackSound.stop()
      this.playbackSound = null
    }

    clearInterval(this.cursorBlinkTimer)
    window.removeEventListener('resize', this.handleEditorResize)
    window.onbeforeunload = null
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
      let ts = this.recordStartOt.getRelativeTS()
      const runStartOT = new ElicastRun(ts)
      this.ots.push(runStartOT)
      this.redrawRunOutput(runStartOT)
      this.playModeReady = false

      const toast = this.$refs.toast.show({
        class: ['alert', 'alert-warning'],
        content: '<i class="fa fa-terminal"></i> Running...'
      })

      const [exitCode, output] = await ElicastService.runCode(this.code)

      ts = this.recordStartOt.getRelativeTS()
      const runResultOT = new ElicastRun(ts, exitCode, output)
      this.ots.push(runResultOT)
      this.redrawRunOutput(runResultOT)
      this.playModeReady = true

      this.$refs.toast.remove(toast)
    },
    async cutOts () {
      this.logger.submit('cut-ots', {
        'id': this.elicastId,
        'ts': this.ts
      })

      const firstCutOtIdx = this.ots.findIndex(ot => this.ts < ot.ts)
      if (firstCutOtIdx <= 0) return

      const lastAppliedOt = this.ots[firstCutOtIdx - 1]

      if (!_.isUndefined(lastAppliedOt._exId)) {
        this.$refs.toast.show({
          class: ['alert', 'alert-warning'],
          content: 'You cannot cut inside of exercise!',
          lifespan: 2000
        })
        return
      }
      if (!_.isUndefined(lastAppliedOt._assert)) {
        this.$refs.toast.show({
          class: ['alert', 'alert-warning'],
          content: 'You cannot cut inside of assert!',
          lifespan: 2000
        })
        return
      }

      this.playModeReady = false

      const toast = this.$refs.toast.show({
        class: ['alert', 'alert-warning'],
        content: '<i class="fa fa-scissors"></i> Cutting...'
      })

      const lastRecordStartOt = _.findLast(this.ots, ot => ot.ts <= this.ts &&
        ot.constructor === ElicastRecordStart)
      const lastSoundChunkIdx = lastRecordStartOt.soundChunkIdx

      const reducedChunk = await ElicastService.splitAudio(
        [[0, this.ts - lastRecordStartOt.ts]], this.soundManager.chunks[lastSoundChunkIdx])
      this.soundManager.chunks.splice(
        lastSoundChunkIdx, this.soundManager.chunks.length - lastSoundChunkIdx, reducedChunk)
      await this.soundManager.preload()

      this.maxTs = this.ts
      this.ots.splice(firstCutOtIdx, this.ots.length - firstCutOtIdx)
      this.ots.push(new ElicastRecordEnd(this.ts + 1))  // Trick to invoke ts update
      this.ts += 1

      this.$refs.toast.remove(toast)

      this.playModeReady = true
    },
    async evaluateAssertion () {
      this.runOutput = '/* running... */'
      const [exitCode, output] = await ElicastService.runCode(this.code)
      this.runOutput = output

      return exitCode === 0
    },
    handleEditorResize (e) {
      this.cm.setSize(null, document.documentElement.clientHeight - 200)
    },
    handleEditorBeforeChange (cm, changeObj) {
      if (!this.playMode.isRecording()) return

      switch (this.playMode) {
        case PlayMode.RECORD:
        case PlayMode.ASSERT:
          if (!ElicastOT.isChangeAllowedForRecord(this.ots, cm, changeObj)) {
            console.warn('Editing non-editable area')
            changeObj.cancel()
            return
          }
          break
        case PlayMode.RECORD_EXERCISE:
          if (!ElicastOT.isChangeAllowedForRecordExercise(this.ots, this.recordExerciseSession, cm, changeObj)) {
            console.warn('Editing non-editable area')
            changeObj.cancel()
            return
          }
          break
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
      this.forceCursorBlink()

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
      this.handleSliderChangeLog(val, isMouseDown)

      if (isMouseDown) this.playMode = PlayMode.PAUSE
      this.ts = val
    },
    handleSliderChangeLog: _.debounce(function (val, isMouseDown) {
      this.logger.submit('handle-slider-change', {
        'id': this.elicastId,
        'playMode': this.playMode,
        'val': val,
        'isMouseDown': isMouseDown
      })
    }, 100),
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
    cursorBlinkTick () {
      this.cursorBlinkTimer = setTimeout(() => {
        this.toggleCursorBlink()
        this.cursorBlinkTick()
      }, CURSOR_BLINK_RATE)
    },
    forceCursorBlink () {
      this.toggleCursorBlink(true)
      clearTimeout(this.cursorBlinkTimer)
      this.cursorBlinkTick()
    },
    toggleCursorBlink (forceShow) {
      const cmCursor = this.$el.querySelector('.CodeMirror-cursors')
      if (this.playMode === PlayMode.PLAYBACK) {
        if (forceShow || cmCursor.className.indexOf('cursor-hide') >= 0) {
          cmCursor.classList.add('cursor-show')
          cmCursor.classList.remove('cursor-hide')
        } else {
          cmCursor.classList.remove('cursor-show')
          cmCursor.classList.add('cursor-hide')
        }
      } else {
        if (cmCursor.className.indexOf('cursor-show') >= 0) {
          cmCursor.classList.remove('cursor-show')
        }
        if (forceShow || cmCursor.className.indexOf('cursor-hide') >= 0) {
          cmCursor.classList.remove('cursor-hide')
        } else {
          cmCursor.classList.add('cursor-hide')
        }
      }
    },
    togglePlayMode () {
      if (!this.playModeReady) return

      this.logger.submit('toggle-play-mode', {
        'id': this.elicastId,
        'playMode': this.playMode,
        'ts': this.ts
      })

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

      this.logger.submit('toggle-record-exercise', {
        'id': this.elicastId,
        'playMode': this.playMode,
        'ts': this.ts
      })

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

      this.logger.submit('toggle-record-assert', {
        'id': this.elicastId,
        'playMode': this.playMode,
        'ts': this.ts
      })

      let isPassed = await this.evaluateAssertion()
      if (!isPassed) {
        alert('Assertion failed.')
        return
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
    RunOutputView,
    Toast
  }
}
