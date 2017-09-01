import { ElicastAssert } from '@/elicast/elicast-ot'
import _ from 'lodash'

function markAssertOTs (recordAssertSession) {
  let assertStartIndex = _.findLastIndex(recordAssertSession.ots,
    ot => ot instanceof ElicastAssert)

  for (let i = assertStartIndex + 1; i < recordAssertSession.ots.length; i++) {
    if (recordAssertSession.ots[i] instanceof ElicastAssert) throw new Error('Invalid assert ot')
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
    markAssertOTs(this)
    const newOt = new ElicastAssert(ts)
    this.ots.push(newOt)
  }

  getAssertOTs () {
    return this.ots.slice(this.startOTIndex)
  }
}
