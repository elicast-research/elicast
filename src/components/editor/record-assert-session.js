import { ElicastText, ElicastAssert } from '@/elicast/elicast-ot'
import _ from 'lodash'

function markAssertOTs (recordAssertSession) {
  let assertStartIndex = recordAssertSession.ots.findIndex(ot => ot instanceof ElicastAssert)

  for (let i = assertStartIndex + 1; i < recordAssertSession.ots.length; i++) {
    if (recordAssertSession.ots[i] instanceof ElicastAssert) break
    recordAssertSession.ots[i]._assert = true
  }
}

export default class RecordAssertSession {
  constructor (ots) {
    if (!_.isArray(ots)) throw new Error('Invalid ots')
    this.ots = ots
  }

  startRecording (ts) {
    const startOT = new ElicastAssert(ts)
    this.startOT = startOT
    this.startOTIndex = this.ots.push(startOT) - 1
    return startOT
  }

  finishRecording (ts) {
    const newOt = new ElicastAssert(ts)
    this.ots.push(newOt)
    markAssertOTs(this)
  }

  /**
   * isInitiated - whether any text change happened during the assert
   * recording session.
   *
   * @return {Boolean}  true if initiated, otherwise false
   */
  isInitiated () {
    return !_.isNil(this.startOTIndex) &&
      this.ots.slice(this.startOTIndex).some(ot => ot instanceof ElicastText)
  }

  getAssertOTs () {
    return this.ots.slice(this.startOTIndex)
  }
}
