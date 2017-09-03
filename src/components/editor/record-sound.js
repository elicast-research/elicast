import { Howl } from 'howler'
import Promise from 'bluebird'

/**
 *  RecordSound
 */
export default class RecordSound {
  constructor (mimeType, recordedBlobs = null) {
    this.mediaRecorder = null
    this.mimeType = mimeType
    this.chunks = recordedBlobs !== null ? recordedBlobs : []
  }

  async record () {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: this.mimeType })
    this.mediaRecorder.ondataavailable = this._onDataAvailable.bind(this)
    this.mediaRecorder.start()
  }

  async stopRecording () {
    if (!this.mediaRecorder) throw new Error('Not recording')

    const stopPromise = Promise.fromCallback(callback =>
      this.mediaRecorder.addEventListener('stop', event => callback(null, event)))

    this.mediaRecorder.stop()
    await stopPromise
  }

  async load () {
    const blobUrl = URL.createObjectURL(new Blob(this.chunks, { type: this.mimeType }))
    const sound = new Howl({ src: [blobUrl], format: ['webm'] })

    await Promise.fromCallback(callback => sound.once('load', callback))
    return sound
  }

  _onDataAvailable (event) {
    this.chunks.push(event.data)
  }
}
