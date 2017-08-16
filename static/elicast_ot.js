/*  OT for Elicast
 *
 *  Structure := [ timestamp, command, commandArgs... ]
 *
 *  Two types of commands := "selection", "text", "exPlaceholder", "exShow"
 *   - "selection" : fromPos, toPos
 *   - "text" : fromPos, toPos, insertedText, removedText
 *   - "exPlaceholder" : exId, title, description, solutionOts
 *   - "exShow" : exId
 *
 *  When calculating "Pos", OT regards all line endings as "\n"
 *
 */


ElicastOT = {};


/*  This function validate Elicast OT
 *
 *  Args
 *    - ot (list)
 *
 *  Return := true if `ot` is valid Elicast OT
 *
 */
function validateOt(ot) {

}


/*  This function convert "selection" OT to CodeMirror's
 *  selection object for `cm.setSelection` function.
 *
 *  Args
 *    - doc (string) -- The content of CodeMirror document
 *    - ot (list) -- Elicast "selection" OT
 *
 *  Return := CodeMirror's selection object
 *
 */
ElicastOT.toCMSelection = function(doc, ot) {
  if (!validateOt(ot) || ot[1] != "selection") {
    console.error("Invalid or unacceptable OT");
    return;
  }
};


/*  This function convert "text" OT to CodeMirror's replace
 *  object for `cm.replaceRange` function.
 *
 *  Args
 *    - doc (string) -- The content of CodeMirror document
 *    - ot (list) -- Elicast "text" OT
 *
 *  Return := CodeMirror's replace object
 *
 */
ElicastOT.toCMReplace = function(doc, ot) {
  if (!validateOt(ot) || ot[1] != "text") {
    console.error("Invalid or unacceptable OT");
    return;
  }
};


/*  This function convert CodeMirror's selection object
 *  (from `cm.cursorActivity` event) to Elicast "selection" OT.
 *
 *  Args
 *    - doc (string) -- The content of CodeMirror document
 *    - cmSel (object) -- CodeMirror's selection object
 *
 *  Return := Elicast "selection" OT
 *
 */
ElicastOT.fromCMSelection = function(doc, cmSel) {

};


/*  This function convert CodeMirror's selection object
 *  (from `cm.change` event) to Elicast "text" OT.
 *
 *  Args
 *    - doc (string) -- The content of CodeMirror document
 *    - cmReplace (object) -- CodeMirror's selection object
 *
 *  Return := Elicast "text" OT
 *
 */
ElicastOT.fromCMReplace = function(doc, cmReplace) {

};


/*  This function checks effective area of `ots.slice(fromIndex, toIndex)`
 *  and returns whether the range of OTs could be converted to an exercise.
 *
 *  Args
 *    - ots (list) -- list of Elicast OT
 *    - fromIndex (number) -- the starting index of TSel in `ots` (inclusive)
 *    - toIndex (number) -- the ending index of TSel in `ots` (exclusive)
 *
 *  Return := true if `ots.slice(fromIndex, toIndex)` could be an exercise
 *
 */
ElicastOT.checkExerciseable = function(ots, fromIndex, toIndex) {

};


/*  This function convert ESel(Editor-Selection) to TSel(Timeline-Selection).
 *
 *  Args
 *    - ots (list) -- list of Elicast OT
 *    - currentIndex (number) -- current state represented as an index in `ots`
 *    - fromPos (number) -- starting position of ESel
 *    - toPos (number) -- ending position of ESel
 *
 *  Return := list of (fromIndex, toIndex) tuples
 *
 */
ElicastOT.convertESelToTSel = function(ots, currentIndex, fromPos, toPos) {

};
