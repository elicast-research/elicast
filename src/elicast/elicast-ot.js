import _ from 'lodash'

import OTArea from './ot-area'
import ElicastOTAreaSet from './elicast-ot-area-set'

/*  OT for Elicast
 *
 *  Structure := { ts: 123456789, command: "selection", **commandArgs... }
 *
 *  Five types of commands := "nop", "selection", "text", "exPlaceholder", "exShow"
 *   - "nop" :
 *   - "selection" : fromPos, toPos
 *   - "text" : fromPos, toPos, insertedText, removedText
 *   - "exPlaceholder" : exId, solutionOts
 *   - "exShow" : exId, description
 *
 *  When calculating "Pos", OT regards all line endings as "\n"
 *
 */

export default class ElicastOT {
  constructor (ts, command) {
    if (!_.isInteger(ts)) throw new Error('Invalid ts')
    if (!_.isString(command)) throw new Error('Invalid command')

    this.ts = ts
    this.command = command
  }

  static fromJSON (otRaw) {
    return OT_CLASS_MAP[otRaw.command].fromJSON(otRaw)
  }

  clone () {
    return Object.assign(ElicastOT.fromJSON(this), this)  // assign to preserve _attributes
  }
}

export class ElicastNop extends ElicastOT {
  static COMMAND = 'nop'

  constructor (ts, time = Date.now()) {
    super(ts, ElicastNop.COMMAND)

    if (!_.isInteger(time)) throw new Error('Invalid time')

    this.time = time
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.time)
  }

  getRelativeTS (time = Date.now()) {
    return this.ts + time - this.time
  }
}

export class ElicastRecordStart extends ElicastOT {
  static COMMAND = 'record_start'

  constructor (ts, soundChunkIdx, time = Date.now()) {
    super(ts, ElicastRecordStart.COMMAND)

    if (!_.isInteger(soundChunkIdx)) throw new Error('Invalid soundChunkIdx')
    if (!_.isInteger(time)) throw new Error('Invalid time')

    this.soundChunkIdx = soundChunkIdx
    this.time = time
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.soundChunkIdx, ot.time)
  }

  getRelativeTS (time = Date.now()) {
    return this.ts + time - this.time
  }
}

export class ElicastRecordEnd extends ElicastOT {
  static COMMAND = 'record_end'

  constructor (ts) {
    super(ts, ElicastRecordEnd.COMMAND)
  }

  static fromJSON (ot) {
    return new this(ot.ts)
  }
}

export class ElicastSelection extends ElicastOT {
  static COMMAND = 'selection'

  constructor (ts, fromPos, toPos) {
    super(ts, ElicastSelection.COMMAND)

    if (!_.isInteger(fromPos)) throw new Error('Invalid fromPos')
    if (!_.isInteger(toPos)) throw new Error('Invalid toPos')
    if (!(fromPos >= 0 && toPos >= 0)) throw new Error('fromPos and toPos must be non-negative')

    this.fromPos = fromPos
    this.toPos = toPos
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.fromPos, ot.toPos)
  }
}

export class ElicastText extends ElicastOT {
  static COMMAND = 'text'

  constructor (ts, fromPos, toPos, insertedText, removedText) {
    super(ts, ElicastText.COMMAND)

    if (!_.isInteger(fromPos)) throw new Error('Invalid fromPos')
    if (!_.isInteger(toPos)) throw new Error('Invalid toPos')
    if (!(fromPos >= 0 && toPos >= 0)) throw new Error('fromPos and toPos must be non-negative')
    if (!(fromPos <= toPos)) throw new Error('toPos must be greater than fromPos')
    if (!_.isString(insertedText)) throw new Error('Invalid insertedText')
    if (!_.isString(removedText)) throw new Error('Invalid removedText')

    this.fromPos = fromPos
    this.toPos = toPos
    this.insertedText = insertedText
    this.removedText = removedText
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.fromPos, ot.toPos, ot.insertedText, ot.removedText)
  }
}

export class ElicastExercise extends ElicastOT {
  static COMMAND = 'exPlaceholder'

  constructor (ts, exId) {
    super(ts, ElicastExercise.COMMAND)

    if (!_.isInteger(exId)) throw new Error('Invalid exId')
    if (!(exId >= 0)) throw new Error('Invalid exId')

    this.exId = exId
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.exId)
  }
}

export class ElicastExerciseShow extends ElicastOT {
  static COMMAND = 'exShow'

  constructor (ts, exId, description) {
    super(ts, ElicastExerciseShow.COMMAND)

    if (!_.isInteger(exId)) throw new Error('Invalid exId')
    if (!(exId >= 0)) throw new Error('Invalid exId')
    if (!_.isString(description)) throw new Error('Invalid description')

    this.exId = exId
    this.description = description
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.exId, ot.description)
  }
}

export class ElicastRun extends ElicastOT {
  static COMMAND = 'run'

  constructor (ts, exitCode, output) {
    super(ts, ElicastRun.COMMAND)

    if (!(_.isInteger(exitCode) || _.isNil(exitCode))) throw new Error('Invalid exitCode')
    if (!(_.isString(output) || _.isNil(output))) throw new Error('Invalid output')
    if (_.isNil(exitCode) && !_.isNil(output)) throw new Error('Invalid output')

    this.exitCode = exitCode
    this.output = output
  }

  isRunning () {
    return _.isNil(this.exitCode)
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.exitCode, ot.output)
  }
}

export class ElicastAssert extends ElicastOT {
  static COMMAND = 'assert'

  constructor (ts, time = Date.now()) {
    super(ts, ElicastAssert.COMMAND)

    if (!_.isInteger(time)) throw new Error('Invalid time')

    this.time = time
  }

  static fromJSON (ot) {
    return new this(ot.ts, ot.time)
  }

  getRelativeTS (time = Date.now()) {
    return this.ts + time - this.time
  }
}

const OT_CLASS_MAP = _.keyBy([
  ElicastNop,
  ElicastRecordStart,
  ElicastRecordEnd,
  ElicastSelection,
  ElicastText,
  ElicastExercise,
  ElicastExerciseShow,
  ElicastRun,
  ElicastAssert
], otClass => otClass.COMMAND)

/*  This function convert position in `content` to line/ch
 *
 *  Args
 *    - content (string)
 *    - pos (number) -- 0-based position in `content`
 *
 *  Return := { line, ch } object
 *
 */
function posToLineCh (content, pos) {
  let curLine = 0
  let curCh = pos

  const lineSep = /\r\n?|\n/g
  for (curLine = 0; lineSep.exec(content) !== null; curLine++) {
    if (pos < lineSep.lastIndex) {
      break
    }
    curCh = pos - lineSep.lastIndex
  }

  return {
    line: curLine,
    ch: curCh
  }
}

/*  This function convert line/ch in `content` to 0-based position
 *
 *  Args
 *    - content (string)
 *    - lineCh (object) -- line/ch in `content`
 *
 *  Return := number
 *
 */
function lineChToPos (content, lineCh) {
  const lineSep = /\r\n?|\n/g
  for (let i = 0; i < lineCh.line; i++) {
    lineSep.exec(content)
  }
  return lineSep.lastIndex + lineCh.ch
}

function isAreaConflict (area, fromPos, toPos) {
  return (fromPos <= area.fromPos && area.fromPos < toPos) ||
    (area.fromPos < fromPos && fromPos < area.toPos)
}

function getAreas (ots, areaType = ElicastOTAreaSet.TEXT) {
  const areaSet = new ElicastOTAreaSet()

  for (let i = 0; i < ots.length; i++) {
    const ot = ots[i]
    switch (ot.constructor) {
      case ElicastText:
        if (ot.removedText.length > 0) {
          areaSet.remove(areaType, ot.fromPos, ot.fromPos + ot.removedText.length)
        }
        if (ot.insertedText.length > 0) {
          areaSet.insert(areaType, ot.fromPos, ot.fromPos + ot.insertedText.length, true)
        }
        break
      case ElicastExercise:
        let exerciseEndIndex = ots.findIndex((ot, idx) => idx > i && ot instanceof ElicastExercise)
        exerciseEndIndex = exerciseEndIndex < 0 ? ots.length : exerciseEndIndex
        const exerciseAreas = getAreas(ots.slice(i + 1, exerciseEndIndex), ElicastOTAreaSet.EXERCISE_BUILD)
        i = exerciseEndIndex

        if (exerciseAreas.length === 0) break
        if (exerciseAreas.length !== 1) {
          throw new Error('Solution OT must be a single area')
        }

        const exerciseArea = exerciseAreas[0]
        areaSet.insert(ElicastOTAreaSet.EXERCISE, exerciseArea.fromPos, exerciseArea.toPos, false)

        break
      case ElicastAssert:
        let assertEndIndex = ots.findIndex((ot, idx) => idx > i && ot instanceof ElicastAssert)
        assertEndIndex = assertEndIndex < 0 ? ots.length : assertEndIndex
        const assertAreas = getAreas(ots.slice(i + 1, assertEndIndex), ElicastOTAreaSet.ASSERT_BUILD)
        i = assertEndIndex

        if (assertAreas.length === 0) break

        assertAreas.forEach(area => {
          areaSet.insert(ElicastOTAreaSet.ASSERT, area.fromPos, area.toPos, false)
        })
        break
    }
  }

  return areaSet.toArray()
}

/**
 * Get the last OT whose type is `otType` and ts is less or equal than given `ts` in `ots`.
 *
 * @param  {ElicastOT[]} ots           sorted array of OTs
 * @param  {object}      otType        type reference (class constructor) of an OT type
 * @param  {Number}      [ts=Infinity] ts to look left (optional)
 * @return {ElicastOT}                 found OT
 */
ElicastOT.getLastOtForOtType = function (ots, otType, ts = Infinity) {
  return _.findLast(ots, ot => ot.ts <= ts && ot.constructor === otType)
}

ElicastOT.buildText = function (ots) {
  let result = ''
  for (const ot of ots) {
    if (!(ot instanceof ElicastText)) continue
    result = result.substring(0, ot.fromPos) + ot.insertedText + result.substring(ot.toPos)
  }
  return result
}

/*  This function apply given OT to CodeMirror
 *
 *  Args
 *    - cm (CodeMirror) -- The CodeMirror instance
 *    - ot (object) -- Elicast OT
 *
 */
ElicastOT.applyOtToCM = function (cm, ot) {
  const cmContent = cm.doc.getValue()

  switch (ot.constructor) {
    case ElicastSelection: {
      if (cmContent.length < ot.fromPos || cmContent.length < ot.toPos) {
        throw new Error(['The selection is out of range',
          cmContent.length, ot.fromPos, ot.toPos].join(' '))
      }

      const fromLineCh = posToLineCh(cmContent, ot.fromPos)
      const toLineCh = posToLineCh(cmContent, ot.toPos)
      cm.doc.setSelection(fromLineCh, toLineCh)
      break
    }
    case ElicastText: {
      if (cmContent.substring(ot.fromPos, ot.toPos) !== ot.removedText) {
        throw new Error('The removed text is not matched')
      }

      const fromLineCh = posToLineCh(cmContent, ot.fromPos)
      const toLineCh = posToLineCh(cmContent, ot.toPos)
      cm.doc.replaceRange(ot.insertedText, fromLineCh, toLineCh)
      break
    }
  }
}

ElicastOT.revertOtToCM = function (cm, ot) {
  const cmContent = cm.doc.getValue()

  switch (ot.constructor) {
    case ElicastText: {
      if (cmContent.substring(ot.fromPos, ot.fromPos + ot.insertedText.length) !== ot.insertedText) {
        throw new Error('The removed text is not matched')
      }

      const fromLineCh = posToLineCh(cmContent, ot.fromPos)
      const toLineCh = posToLineCh(cmContent, ot.fromPos + ot.insertedText.length)

      cm.doc.replaceRange(ot.removedText, fromLineCh, toLineCh)
      break
    }
  }
}

ElicastOT.redrawExerciseAreas = function (cm, ots) {
  cm.doc.getAllMarks()
    .filter(marker => marker.className === 'exercise-block')
    .forEach(marker => marker.clear())

  const cmContent = cm.doc.getValue()

  getAreas(ots)
    .filter(area => area.type === ElicastOTAreaSet.EXERCISE)
    .forEach(area => {
      const fromLineCh = posToLineCh(cmContent, area.fromPos)
      const toLineCh = posToLineCh(cmContent, area.toPos)
      cm.doc.markText(fromLineCh, toLineCh, { className: 'exercise-block' })
    })
}

ElicastOT.redrawRecordingExerciseArea = function (cm, ots) {
  ElicastOT.clearRecordingExerciseArea(cm)

  const cmContent = cm.doc.getValue()

  const exerciseArea = getAreas(ots).pop()
  if (exerciseArea.type !== ElicastOTAreaSet.EXERCISE) {
    throw new Error('Invalid exercise area')
  }

  const fromLineCh = posToLineCh(cmContent, exerciseArea.fromPos)
  const toLineCh = posToLineCh(cmContent, exerciseArea.toPos)
  cm.doc.markText(fromLineCh, toLineCh, { className: 'recording-exercise-block' })
}

ElicastOT.clearRecordingExerciseArea = function (cm) {
  cm.doc.getAllMarks()
    .filter(marker => marker.className === 'recording-exercise-block')
    .forEach(marker => marker.clear())
}

ElicastOT.redrawSolveExerciseArea = function (cm, solveOts, exerciseFromPos) {
  const CLASS_SOLVE_EXERCISE_BLOCK = 'solve-exercise-block'
  const CLASS_SOLVE_EXERCISE_PLACEHOLDER = 'solve-exercise-placeholder'

  function setPlaceholderBookmark (lineCh) {
    const placeholderElement = document.createElement('span')
    placeholderElement.className = CLASS_SOLVE_EXERCISE_PLACEHOLDER
    placeholderElement.textContent = ' /* Write your answer here */ '
    cm.doc.setBookmark(lineCh, {
      widget: placeholderElement,
      insertLeft: true
    })
  }

  cm.doc.getAllMarks()
    .filter(marker =>
      marker.className === CLASS_SOLVE_EXERCISE_BLOCK || marker.type === 'bookmark')
    .forEach(marker => marker.clear())

  const cmContent = cm.doc.getValue()

  const areas = getAreas(solveOts)
  if (areas.length === 0) {
    console.log(exerciseFromPos)
    setPlaceholderBookmark(posToLineCh(cmContent, exerciseFromPos))
  } else {
    areas.forEach(area => {
      const fromLineCh = posToLineCh(cmContent, area.fromPos)
      const toLineCh = posToLineCh(cmContent, area.toPos)
      cm.doc.markText(fromLineCh, toLineCh, {
        className: CLASS_SOLVE_EXERCISE_BLOCK
      })
    })
  }
}

ElicastOT.redrawAssertAreas = function (cm, ots) {
  // FIXME: integrate with ElicastOT.redrawExerciseAreas
  cm.doc.getAllMarks()
    .filter(marker => marker.className === 'assert-block')
    .forEach(marker => marker.clear())
  const cmContent = cm.doc.getValue()

  getAreas(ots)
    .filter(area => area.type === ElicastOTAreaSet.ASSERT)
    .forEach(area => {
      const fromLineCh = posToLineCh(cmContent, area.fromPos)
      const toLineCh = posToLineCh(cmContent, area.toPos)
      cm.doc.markText(fromLineCh, toLineCh, { className: 'assert-block' })
    })
}

ElicastOT.redrawRecordingAssertArea = function (cm, ots) {
  ElicastOT.clearRecordingAssertArea(cm)

  const cmContent = cm.doc.getValue()

  getAreas(ots)
    .filter(area => area.type === ElicastOTAreaSet.ASSERT)
    .forEach(area => {
      const fromLineCh = posToLineCh(cmContent, area.fromPos)
      const toLineCh = posToLineCh(cmContent, area.toPos)
      cm.doc.markText(fromLineCh, toLineCh, { className: 'recording-assert-block' })
    })
}

ElicastOT.clearRecordingAssertArea = function (cm) {
  // FIXME: integrate with ElicastOT.clearRecordingExerciseArea
  cm.doc.getAllMarks()
    .filter(marker => marker.className === 'recording-assert-block')
    .forEach(marker => marker.clear())
}

/*  This function convert CodeMirror's current selection to Elicast
 *  "selection" OT. To only capture the selection changes, call this
 *  function when `CodeMirror.doc.beforeSelectionChange` event is fired.
 *
 *  Args
 *    - cm (CodeMirror) -- The CodeMirror instance
 *    - ts (Number) -- Timestamp
 *
 *  Return := Elicast "selection" OT
 *
 *  Note
 *    - If there are multiple selections, this function only converts
 *      the first selection.
 *
 */
ElicastOT.makeOTFromCMSelection = function (cm, ts) {
  const cmContent = cm.doc.getValue()
  const selectionRange = cm.doc.listSelections()[0]

  const fromPos = lineChToPos(cmContent, selectionRange.anchor)
  const toPos = lineChToPos(cmContent, selectionRange.head)

  return new ElicastSelection(ts, fromPos, toPos)
}

/*  This function convert CodeMirror's selection object
 *  (from `cm.beforeChange` event) to Elicast "text" OT.
 *
 *  Args
 *    - cm (CodeMirror) -- The CodeMirror instance
 *    - changeObj (object) -- The object passed from beforeChange event
 *    - ts (Number) -- Timestamp
 *
 *  Return := Elicast "text" OT
 *
 *  Note
 *    - We use `beforeChange` instead of `change` or `chages` because to convert
 *      line/ch-cordinate to position-cordinate, we need "before changed" content
 *      of the editor.
 */
ElicastOT.makeOTFromCMChange = function (cm, changeObj, ts, exId) {
  const cmContent = cm.doc.getValue()

  const fromPos = lineChToPos(cmContent, changeObj.from)
  const toPos = lineChToPos(cmContent, changeObj.to)
  const insertedText = changeObj.text.join('\n')
  const removedText = cmContent.substring(fromPos, toPos)

  return new ElicastText(ts, fromPos, toPos, insertedText, removedText, exId)
}

ElicastOT.isChangeAllowedForRecord = function (ots, cm, changeObj) {
  const cmContent = cm.doc.getValue()
  const fromPos = lineChToPos(cmContent, changeObj.from)
  const toPos = lineChToPos(cmContent, changeObj.to)

  // Prevent to edit inside of existing exercise areas
  const areas = getAreas(ots)
  for (const area of areas) {
    if (area.type === ElicastOTAreaSet.EXERCISE && isAreaConflict(area, fromPos, toPos)) {
      return false
    }
  }
  return true
}

ElicastOT.isChangeAllowedForRecordExercise = function (ots, recordExerciseSession, cm, changeObj) {
  const cmContent = cm.doc.getValue()
  const fromPos = lineChToPos(cmContent, changeObj.from)
  const toPos = lineChToPos(cmContent, changeObj.to)

  // Only allow current exercise area

  // Exercise cannot be initiated with text removal
  if (!recordExerciseSession.isInitiated() && fromPos !== toPos) {
    return false
  }

  const exOts = recordExerciseSession.getExerciseOTs()
  const areas = getAreas(exOts)

  if (areas.length === 0) {
    // record not initiated yet
    return true
  } else if (areas.length > 1 || areas[0].type !== ElicastOTAreaSet.EXERCISE) {
    throw new Error('Invalid exercise area')
  }

  const exArea = areas[0]
  return exArea.fromPos <= fromPos && toPos <= exArea.toPos
}

ElicastOT.getAllowedRangeForSolveExercise = function (ots, solveExerciseSession) {
  if (!solveExerciseSession.isInitiated()) {
    // first text ot for solve exercise
    const firstExerciseTextOt = solveExerciseSession.getFirstExerciseTextOt()
    return [firstExerciseTextOt.fromPos, firstExerciseTextOt.toPos]
  } else {
    // within solving area
    const areas = getAreas(solveExerciseSession.solveOts, ElicastOTAreaSet.EXERCISE_BUILD)
    if (areas.length !== 1) {
      throw new Error('Invalid solve area')
    }

    const solveArea = areas[0]
    return [solveArea.fromPos, solveArea.toPos]
  }
}

/**
 * confine text change within solve exercise area by updating given changeObj
 *
 * @return {boolean} true if updated, false otherwise
 */
ElicastOT.confineChangeForSolveExercise = function (ots, solveExerciseSession, cm, changeObj) {
  const cmContent = cm.doc.getValue()
  const fromPos = lineChToPos(cmContent, changeObj.from)
  const toPos = lineChToPos(cmContent, changeObj.to)

  const [solveAreaFromPos, solveAreaToPos] =
    ElicastOT.getAllowedRangeForSolveExercise(ots, solveExerciseSession)

  const newFromPos = posToLineCh(cmContent, _.clamp(fromPos, solveAreaFromPos, solveAreaToPos))
  const newToPos = posToLineCh(cmContent, _.clamp(toPos, solveAreaFromPos, solveAreaToPos))

  if (newFromPos === newToPos) {
    return false
  }

  changeObj.update(
    newFromPos,
    newToPos,
  )
  return true
}

ElicastOT.replacePartialOts = function (ots, startIdx, amount, newOts) {
  // only support single area exercise
  const oriOtsArea = getAreas(ots.slice(startIdx, startIdx + amount)).pop()
  const oriOtsAreaLength = oriOtsArea.toPos - oriOtsArea.fromPos

  const newOtsArea = getAreas(newOts).pop() ||
    // if no solve area (solution is empty text), build a mock empty OTArea
    new OTArea(ElicastOTAreaSet.TEXT, oriOtsArea.fromPos, oriOtsArea.fromPos)
  const newOtsAreaLength = newOtsArea.toPos - newOtsArea.fromPos

  const deltaLength = newOtsAreaLength - oriOtsAreaLength

  ots.splice(startIdx, amount, ...newOts)

  for (let i = startIdx + newOts.length; i < ots.length; i++) {
    const ot = ots[i]
    switch (ot.constructor) {
      case ElicastText:
        if (ot.fromPos >= oriOtsArea.toPos) {
          ot.fromPos += deltaLength
          ot.toPos += deltaLength
        } else {
          const areaShiftLength = ot.insertedText.length - ot.removedText.length
          oriOtsArea.fromPos += areaShiftLength
          oriOtsArea.toPos += areaShiftLength
          newOtsArea.fromPos += areaShiftLength
          newOtsArea.toPos += areaShiftLength
        }
        break
      case ElicastSelection:
        if (oriOtsArea.toPos <= ot.fromPos) {
          ot.fromPos += deltaLength
          ot.toPos += deltaLength
        } else if (ot.fromPos <= oriOtsArea.fromPos && oriOtsArea.toPos <= ot.toPos) {
          ot.toPos += deltaLength
        } else if (oriOtsArea.fromPos <= ot.fromPos && ot.fromPos < oriOtsArea.toPos &&
                   oriOtsArea.fromPos < ot.toPos) {
          ot.fromPos = newOtsArea.toPos
        } else if (oriOtsArea.fromPos < ot.toPos && ot.toPos <= oriOtsArea.toPos) {
          ot.toPos = newOtsArea.fromPos
        }
        break
    }
  }
}

ElicastOT.getSegments = function (ots) {
  const segmentableTypes = [ElicastExercise, ElicastAssert]

  let currentSegmentType = null
  return ots
    .map(ot => {
      if (segmentableTypes.includes(ot.constructor)) {
        currentSegmentType = !currentSegmentType ? ot.constructor : null
      }
      return { ot, type: currentSegmentType }
    })
    .reduce((segments, { ot, type }) => {
      const lastSegment = segments.length && segments[segments.length - 1]
      if (!lastSegment || lastSegment.type !== type) {
        segments.push({ fromTs: ot.ts, toTs: ot.ts, type })
      } else {
        lastSegment.toTs = ot.ts
      }
      return segments
    }, [])
    .filter(segment => segment.type !== null)
}
