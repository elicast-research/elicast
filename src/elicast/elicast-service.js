import ElicastOT, { ElicastExercise, ElicastAssert } from './elicast-ot'
import Elicast from './elicast'
import axios from 'axios'
import _ from 'lodash'
import blobUtil from 'blob-util'
import qs from 'qs'

const SERVICE_ENDPOINT = process.env.ELICAST_ENDPOINT

export default class ElicastService {

  static async listElicasts () {
    const response = await axios.get(SERVICE_ENDPOINT + '/elicast')
    return response.data.elicasts
  }

  static async loadElicast (elicastId) {
    const response = await axios.get(SERVICE_ENDPOINT + '/elicast/' + elicastId)
    const elicastRaw = response.data.elicast

    const ots = elicastRaw.ots.map(ElicastOT.fromJSON)

    let lastExId = null
    let lastAssert = null
    for (let i = 0; i < ots.length; i++) {
      const ot = ots[i]
      if (ot instanceof ElicastExercise) {
        lastExId = _.isNull(lastExId) ? ot.exId : null
      } else if (!_.isNull(lastExId)) {
        ot._exId = lastExId
      } else if (!_.isUndefined(ot._exId)) {
        delete ot._exId
      }

      if (ot instanceof ElicastAssert) {
        lastAssert = _.isNull(lastAssert) ? true : null
      } else if (!_.isNull(lastAssert)) {
        ot._assert = lastAssert
      } else if (!_.isUndefined(ot._assert)) {
        delete ot._assert
      }
    }

    return new Elicast(
      elicastRaw.id,
      elicastRaw.title,
      ots,
      await Promise.all(elicastRaw.voice_blobs.map(blobUtil.dataURLToBlob))
    )
  }

  static async saveElicast (elicast) {
    const response = await axios.put(SERVICE_ENDPOINT + '/elicast',
      qs.stringify({
        title: elicast.title,
        ots: JSON.stringify(elicast.ots),
        voice_blobs: JSON.stringify(
          await Promise.all(elicast.voiceBlobs.map(blobUtil.blobToDataURL)))
      }))

    return response.data.elicast.id
  }

  static async updateElicast (elicastId, elicast) {
    await axios.post(SERVICE_ENDPOINT + '/elicast/' + elicastId,
      qs.stringify({
        title: elicast.title,
        ots: JSON.stringify(elicast.ots),
        voice_blobs: JSON.stringify(
          await Promise.all(elicast.voiceBlobs.map(blobUtil.blobToDataURL)))
      }))
  }

  static async removeElicast (elicastId) {
    await axios.delete(SERVICE_ENDPOINT + '/elicast/' + elicastId)
  }

  static async runCode (code) {
    const response = await axios.post(SERVICE_ENDPOINT + '/code/run',
      qs.stringify({ code }))

    return [response.data.exit_code, response.data.output]
  }

}
