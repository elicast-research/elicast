import { ElicastText, ElicastNop, ElicastExercise } from '@/elicast/elicast-ot'
import _ from 'lodash'

export default class SolveExerciseSession {
  constructor (ots, exerciseStartOt) {
    if (!_.isArray(ots)) throw new Error('Invalid ots')
    if (!(exerciseStartOt instanceof ElicastExercise)) throw new Error('Invalid start ot')

    this.ots = ots
    this.exId = exerciseStartOt.exId
    this.exerciseStartOt = exerciseStartOt
    this.exerciseStartIndex = ots.indexOf(exerciseStartOt)
    this.exerciseEndOt = ots.find((ot, idx) =>
      idx > this.exerciseStartIndex && ot instanceof ElicastExercise)
    this.exerciseEndIndex = ots.indexOf(this.exerciseEndOt)
    this.solveOts = []
  }

  start () {
    this.solveOts.push(new ElicastNop(this.getTs()))
  }

  finish () {
    this.solveOts.push(new ElicastNop(this.getTs()))

    this.exerciseStartOt._solved = true
    this.exerciseEndOt._solved = true

    // set _exId for every ot in solveOts
    this.solveOts.forEach(ot => {
      ot._exId = this.exId
    })
  }

  /**
   * isInitiated - whether any text change happened during the solve exercise
   * session.
   *
   * @return {Boolean}  true if initiated, otherwise false
   */
  isInitiated () {
    return this.solveOts.some(ot => ot instanceof ElicastText)
  }

  pushSolveOt (ot) {
    this.solveOts.push(ot)
  }

  getTs () {
    return Math.round((this.exerciseStartOt.ts + this.exerciseEndOt.ts) / 2)
  }

  getFirstExerciseTextOt () {
    return this.ots.find((ot, idx) => idx > this.exerciseStartIndex && ot instanceof ElicastText)
  }
}
