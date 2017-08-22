import { Howl } from 'howler'
import Promise from 'bluebird'

/**
 *  RecordSound
 */
export default class RecordSound {
  constructor (mimeType) {
    this.mediaRecorder = null
    this.recordedBlob = null
    this.chunks = []
  }

  async record () {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.chunks = []
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

    const newBlob = new Blob(this.chunks)
    this.recordedBlob = !this.recordedBlob ? newBlob
      : new Blob([this.recordedBlob, newBlob], { type: this.mimeType })
  }

  async load () {
    const blobUrl = URL.createObjectURL(this.recordedBlob)
    const sound = new Howl({ src: [blobUrl], format: ['webm'] })

    await Promise.fromCallback(callback => sound.once('load', callback))
    return sound
  }

  _onDataAvailable (event) {
    this.chunks.push(event.data)
  }
}
