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

export default function ElicastOT() {

}


/*  This function validate Elicast OT
 *
 *  Args
 *    - ot (object)
 *
 *  Return := true if `ot` is valid Elicast OT
 *
 */
function validateOt(ot) {
  if (typeof ot !== "object" || typeof ot.ts !== "number" || typeof ot.command !== "string") {
    return false;
  }

  if (ot.command === "nop") {
    return true;

  } else if (ot.command === "selection") {
    return (typeof ot.fromPos === "number" && typeof ot.toPos === "number" &&
      ot.fromPos >= 0 && ot.fromPos <= ot.toPos);

  } else if (ot.command === "text") {
    return (typeof ot.fromPos === "number" && typeof ot.toPos === "number" &&
      typeof ot.insertedText === "string" && typeof ot.removedText === "string" &&
      ot.fromPos >= 0 && ot.fromPos <= ot.toPos);

  } else if (ot.command === "exPlaceholder") {
    if (!(typeof ot.exId === "number" && ot.exId >= 0)) {
      return false;
    }

    for (const solutionOt of ot.solutionOts) {
      if (!validateOt(solutionOt)) {
        return false;
      }
    }
    return true;

  } else if (ot.command === "exShow") {
    return (typeof ot.exId === "number" && typeof ot.description === "string" &&
      typeof ot.exId >= 0);

  } else {
    return false;
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
function posToLineCh(content, pos) {
  let curLine = 0;
  let curCh = pos;

  const lineSep = /\r\n?|\n/g;
  for (curLine = 0; lineSep.exec(content) !== null; curLine++) {
    if (pos < lineSep.lastIndex) {
      break;
    }
    curCh = pos - lineSep.lastIndex;
  }

  return {
    line: curLine,
    ch: curCh
  };
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
function lineChToPos(content, lineCh) {
  const lineSep = /\r\n?|\n/g;
  for (let i = 0; i < lineCh.line; i++) {
    lineSep.exec(content);
  }
  return lineSep.lastIndex + lineCh.ch;
}


function isAreaConflict(area, fromPos, toPos) {
  return (fromPos <= area.fromPos && area.toPos <= toPos) || // case: [ fromPos { area } toPos ]
    (fromPos <= area.fromPos && area.fromPos < toPos) || // case: [ fromPos { area toPos ] area }
    (fromPos < area.toPos && area.toPos <= toPos) || // case: { area [ fromPos area } toPos ]
    (area.fromPos <= fromPos && toPos <= area.toPos); // case: { area [ fromPos toPos ] area }
}


function getExerciseAreas(ots) {
  // TODO: use binary search in areas for efficiency
  const areas = [];
  for (const ot of ots) {
    if (ot.command === "text") {
      const deltaPos = ot.insertedText.length - ot.removedText.length;

      for (const area of areas) {
        if (isAreaConflict(area, ot.fromPos, ot.toPos)) {
          console.error("OT conflicts to exercise area");
          return;
        }

        if (ot.toPos <= area.fromPos) {
          area.fromPos += deltaPos;
          area.toPos += deltaPos;
        }
      }
    } else if (ot.command === "exPlaceholder") {
      // areas.push({
      //   type: "exercise",
      //   fromPos: ot.fromPos,
      //   toPos: ot.toPos
      // });
    }
  }

  areas.sort((areaA, areaB) => areaA.fromPos - areaB.fromPos);

  return areas;
}


function getAreas(ots) {
  let docLength = 0;
  for (const ot of ots) {
    if (ot.command === "text") {
      docLength += ot.insertedText.length - ot.removedText.length;
    } else if (ot.command === "exPlaceholder") {
      for (const solutionOt of ot.solutionOts) {
        if (solutionOt.command === "text") {
          docLength += solutionOt.insertedText.length - solutionOt.removedText.length;
        }
      }
    }
  }
}


/*  This function apply given OT to CodeMirror
 *
 *  Args
 *    - cm (CodeMirror) -- The CodeMirror instance
 *    - ot (object) -- Elicast OT
 *
 */
ElicastOT.applyOtToCM = function(cm, ot) {
  if (!validateOt(ot)) {
    console.error("Invalid OT");
    return;
  }

  const cmContent = cm.doc.getValue();

  if (ot.command === "nop") {
    return;

  } else if (ot.command === "selection") {
    if (cmContent.length < ot.fromPos || cmContent.length < ot.toPos) {
      console.error("The selection is out of range");
      return;
    }

    const fromLineCh = posToLineCh(cmContent, ot.fromPos);
    const toLineCh = posToLineCh(cmContent, ot.toPos);
    cm.doc.setSelection(fromLineCh, toLineCh);

  } else if (ot.command === "text") {
    if (cmContent.substring(ot.fromPos, ot.toPos) !== ot.removedText) {
      console.error("The removed text is not matched");
      return;
    }

    const fromLineCh = posToLineCh(cmContent, ot.fromPos);
    const toLineCh = posToLineCh(cmContent, ot.toPos);
    cm.doc.replaceRange(ot.insertedText, fromLineCh, toLineCh);

  } else if (ot.command === "exPlaceholder") {
    console.error("Not implemented");

  } else if (ot.command === "exShow") {
    console.error("Not implemented");

  } else {
    console.error("Invalid OT command", ot.command);
  }
};


/*  This function convert CodeMirror's current selection to Elicast
 *  "selection" OT. To only capture the selection changes, call this
 *  function when `CodeMirror.doc.beforeSelectionChange` event is fired.
 *
 *  Args
 *    - cm (CodeMirror) -- The CodeMirror instance
 *
 *  Return := Elicast "selection" OT
 *
 *  Note
 *    - If there are multiple selections, this function only converts
 *      the first selection.
 *
 */
ElicastOT.makeOTFromCMSelection = function(cm) {
  const cmContent = cm.doc.getValue();
  const selectionRange = cm.doc.listSelections()[0];

  const fromPos = lineChToPos(cmContent, selectionRange.anchor);
  const toPos = lineChToPos(cmContent, selectionRange.head);

  return {
    ts: (new Date()).getTime(),
    command: "selection",
    fromPos: fromPos,
    toPos: toPos
  };
};


/*  This function convert CodeMirror's selection object
 *  (from `cm.beforeChange` event) to Elicast "text" OT.
 *
 *  Args
 *    - cm (CodeMirror) -- The CodeMirror instance
 *    - changeObj (object) -- The object passed from beforeChange event
 *
 *  Return := Elicast "text" OT
 *
 *  Note
 *    - We use `beforeChange` instead of `change` or `chages` because to convert
 *      line/ch-cordinate to position-cordinate, we need "before changed" content
 *      of the editor.
 */
ElicastOT.makeOTFromCMChange = function(cm, changeObj) {
  const cmContent = cm.doc.getValue();

  const fromPos = lineChToPos(cmContent, changeObj.from);
  const toPos = lineChToPos(cmContent, changeObj.to);

  return {
    ts: (new Date()).getTime(),
    command: "text",
    fromPos: fromPos,
    toPos: toPos,
    insertedText: changeObj.text.join("\n"),
    removedText: cmContent.substring(fromPos, toPos)
  };
};


ElicastOT.isChangeAllowed = function(ots, exerciseStartIndex, cm, changeObj) {
  const cmContent = cm.doc.getValue();
  const fromPos = lineChToPos(cmContent, changeObj.from);
  const toPos = lineChToPos(cmContent, changeObj.to);

  if (exerciseStartIndex < 0) {
    // Prevent to edit inside of existing exercise areas
    const exerciseAreas = getExerciseAreas(ots);
    for (const area of exerciseAreas) {
      if (isAreaConflict(area, fromPos, toPos)) {
        return false;
      }
    }

    return true;

  } else {
    // Only allow current exercise area
    const exOts = ots.slice(exerciseStartIndex);

    // // Allow inserting text at anyware if there is no text OT yet
    // let isExStarted = false;
    // for (const ot of exOts) {
    //   if (ot.command === "text") {
    //     isExStarted = true;
    //     break;
    //   }
    // }
    //
    // if (!isExStarted) {
    //   return true;
    // }

  }
}
