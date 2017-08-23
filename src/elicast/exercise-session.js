import { ElicastExercise } from './elicast_ot'
import _ from 'lodash'

function markExerciseOTs (exerciseSession) {
  let exerciseStartIndex = exerciseSession.ots.findIndex(ot =>
    ot instanceof ElicastExercise && ot.exId === exerciseSession.exId)

  for (let i = exerciseStartIndex + 1; i < exerciseSession.ots.length; i++) {
    if (exerciseSession.ots[i] instanceof ElicastExercise) break
    exerciseSession.ots[i]._exId = exerciseSession.exId
  }
}

export default class ExerciseSession {
  static lastExId = 1

  constructor (ots) {
    if (!_.isArray(ots)) throw new Error('Invalid ots')

    this.ots = ots
    this.exId = ExerciseSession.lastExId++
  }

  startRecording (ts) {
    this.startOT = new ElicastExercise(ts, this.exId)
    this.ots.push(this.startOT)
  }

  endRecording (ts) {
    const newOt = new ElicastExercise(ts, this.exId)
    this.ots.push(newOt)

    markExerciseOTs(this)
  }
}
