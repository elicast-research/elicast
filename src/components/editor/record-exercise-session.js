import { ElicastText, ElicastExercise } from '@/elicast/elicast-ot'
import _ from 'lodash'

function markExerciseOTs (recordExerciseSession) {
  let exerciseStartIndex = recordExerciseSession.ots.findIndex(ot =>
    ot instanceof ElicastExercise && ot.exId === recordExerciseSession.exId)

  for (let i = exerciseStartIndex + 1; i < recordExerciseSession.ots.length; i++) {
    if (recordExerciseSession.ots[i] instanceof ElicastExercise) break
    recordExerciseSession.ots[i]._exId = recordExerciseSession.exId
  }
}

export default class RecordExerciseSession {
  constructor (ots, exId) {
    if (!_.isArray(ots)) throw new Error('Invalid ots')
    if (!(_.isInteger(exId) && exId > 0)) throw new Error('Invalid exId')

    this.ots = ots
    this.exId = exId
  }

  startRecording (ts) {
    const startOT = new ElicastExercise(ts, this.exId)
    this.startOT = startOT
    this.startOTIndex = this.ots.push(startOT) - 1
  }

  finishRecording (ts) {
    const newOt = new ElicastExercise(ts, this.exId)
    this.ots.push(newOt)

    markExerciseOTs(this)
  }

  /**
   * isInitiated - whether any text change happened during the exercise
   * recording session.
   *
   * @return {Boolean}  true if initiated, otherwise false
   */
  isInitiated () {
    return !_.isNil(this.startOTIndex) &&
      this.ots.slice(this.startOTIndex).some(ot => ot instanceof ElicastText)
  }

  getExerciseOTs () {
    return this.ots.slice(this.startOTIndex)
  }
}
