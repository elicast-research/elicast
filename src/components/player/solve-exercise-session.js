import { ElicastText, ElicastNop, ElicastExercise } from '@/elicast/elicast-ot'
import _ from 'lodash'

export default class SolveExerciseSession {
  constructor (ots, exerciseStartOt) {
    if (!_.isArray(ots)) throw new Error('Invalid ots')
    if (!(exerciseStartOt instanceof ElicastExercise)) throw new Error('Invalid start ot')

    this.ots = ots
    this.exerciseStartOt = exerciseStartOt
    this.exerciseStartIndex = ots.indexOf(exerciseStartOt)
    this.solveOts = []
  }

  start () {
    this.solveOts.push(new ElicastNop(this.exerciseStartOt.ts))
  }

  finish () {
    const ts = this.getRelativeTS()
    this.solveOts.push(new ElicastNop(ts))

    // TODO replace exercise OTs with solveOts
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

  getRelativeTS () {
    if (this.solveOts.length === 0) throw new Error('Session not started!')
    return this.solveOts[0].getRelativeTS()
  }

  getFirstExerciseTextOt () {
    return this.ots.find((ot, idx) => idx > this.exerciseStartIndex && ot instanceof ElicastText)
  }
}
