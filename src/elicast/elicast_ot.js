import _ from 'lodash'

import OTArea from './ot_area.js'

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
}

export class ElicastNop extends ElicastOT {
  constructor (ts, time = Date.now()) {
    super(ts, 'nop')

    if (!_.isInteger(time)) throw new Error('Invalid time')

    this.time = time
  }

  getRelativeTS (time = Date.now()) {
    return this.ts + time - this.time
  }
}

export class ElicastSelection extends ElicastOT {
  constructor (ts, fromPos, toPos) {
    super(ts, 'selection')

    if (!_.isInteger(fromPos)) throw new Error('Invalid fromPos')
    if (!_.isInteger(toPos)) throw new Error('Invalid toPos')
    if (!(fromPos >= 0 && toPos >= 0)) throw new Error('fromPos and toPos must be non-negative')

    this.fromPos = fromPos
    this.toPos = toPos
  }
}

export class ElicastText extends ElicastOT {
  constructor (ts, fromPos, toPos, insertedText, removedText) {
    super(ts, 'text')

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
}

export class ElicastExercise extends ElicastOT {
  constructor (ts, exId) {
    super(ts, 'exPlaceholder')

    if (!_.isInteger(exId)) throw new Error('Invalid exId')
    if (!(exId >= 0)) throw new Error('Invalid exId')

    this.exId = exId
  }
}

export class ElicastExerciseShow extends ElicastOT {
  constructor (ts, exId, description) {
    super(ts, 'exShow')

    if (!_.isInteger(exId)) throw new Error('Invalid exId')
    if (!(exId >= 0)) throw new Error('Invalid exId')
    if (!_.isString(description)) throw new Error('Invalid description')

    this.exId = exId
    this.description = description
  }
}

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

function getAreas (ots) {
  const areas = []

  for (let i = 0; i < ots.length; i++) {
    const ot = ots[i]
    switch (ot.constructor) {
      case ElicastText:
        if (ot.removedText.length > 0) {
          OTArea.remove(areas, 'text', ot.fromPos, ot.fromPos + ot.removedText.length)
        }
        if (ot.insertedText.length > 0) {
          OTArea.insert(areas, 'text', ot.fromPos, ot.fromPos + ot.insertedText.length, true)
        }
        break
      case ElicastExercise:
        let j = i + 1

        // find the last OT of the current exercise
        for (; j < ots.length; j++) {
          if (ots[j] instanceof ElicastExercise) {
            if (ots[j].exId !== ot.exId) throw new Error('Invalid exId')
            break
          }
        }
        const exerciseAreas = getAreas(ots.slice(i + 1, j))
        i = j

        if (exerciseAreas.length === 0) break
        if (exerciseAreas.length !== 1 || exerciseAreas[0].type !== 'text') {
          throw new Error('Solution OT must be a single text area')
        }

        const exerciseArea = exerciseAreas[0]
        OTArea.insert(areas, 'exercise', exerciseArea.fromPos, exerciseArea.toPos, false)

        break
    }
  }

  return areas
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

  if (ot.command === 'nop') {
    return
  } else if (ot.command === 'selection') {
    if (cmContent.length < ot.fromPos || cmContent.length < ot.toPos) {
      throw new Error('The selection is out of range')
    }

    const fromLineCh = posToLineCh(cmContent, ot.fromPos)
    const toLineCh = posToLineCh(cmContent, ot.toPos)
    cm.doc.setSelection(fromLineCh, toLineCh)
  } else if (ot.command === 'text') {
    if (cmContent.substring(ot.fromPos, ot.toPos) !== ot.removedText) {
      throw new Error('The removed text is not matched')
    }

    const fromLineCh = posToLineCh(cmContent, ot.fromPos)
    const toLineCh = posToLineCh(cmContent, ot.toPos)
    cm.doc.replaceRange(ot.insertedText, fromLineCh, toLineCh)
  } else if (ot.command === 'exPlaceholder') {
    return
  } else if (ot.command === 'exShow') {
    return
  } else {
    throw new Error('Invalid OT command', ot.command)
  }
}

ElicastOT.revertOtToCM = function (cm, ot) {
  const cmContent = cm.doc.getValue()

  if (ot.command === 'selection') {
    ElicastOT.applyOtToCM(cm, ot)
  } else if (ot.command === 'text') {
    if (cmContent.substring(ot.fromPos, ot.fromPos + ot.insertedText.length) !== ot.insertedText) {
      throw new Error('The removed text is not matched')
    }

    const fromLineCh = posToLineCh(cmContent, ot.fromPos)
    const toLineCh = posToLineCh(cmContent, ot.fromPos + ot.insertedText.length)

    cm.doc.replaceRange(ot.removedText, fromLineCh, toLineCh)
  }
}

ElicastOT.redrawExerciseAreas = function (cm, ots) {
  cm.doc.getAllMarks()
    .filter(marker => marker.className === 'exercise-block')
    .forEach(marker => marker.clear())

  const cmContent = cm.doc.getValue()

  getAreas(ots)
    .filter(area => area.type === 'exercise')
    .forEach(area => {
      const fromLineCh = posToLineCh(cmContent, area.fromPos)
      const toLineCh = posToLineCh(cmContent, area.toPos)
      cm.doc.markText(fromLineCh, toLineCh, { className: 'exercise-block' })
    })
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

ElicastOT.isChangeAllowed = function (ots, exerciseSession, cm, changeObj) {
  const cmContent = cm.doc.getValue()
  const fromPos = lineChToPos(cmContent, changeObj.from)
  const toPos = lineChToPos(cmContent, changeObj.to)

  if (!exerciseSession) {
    // Prevent to edit inside of existing exercise areas
    const areas = getAreas(ots)
    for (const area of areas) {
      if (area.type === 'exercise' && isAreaConflict(area, fromPos, toPos)) {
        return false
      }
    }
    return true
  } else {
    const exerciseStartIndex = ots.indexOf(exerciseSession.startOT)
    // Only allow current exercise area
    const exOts = ots.slice(exerciseStartIndex)
    const areas = getAreas(exOts)

    if (areas.length === 0) {
      return true
    } else if (areas.length > 1 || areas[0].type !== 'exercise') {
      console.log(areas)
      throw new Error('Exercise area is inconsistent')
    }

    const exArea = areas[0]
    return exArea.fromPos <= fromPos && toPos <= exArea.toPos
  }
}
