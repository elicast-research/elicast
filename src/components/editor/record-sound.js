import { Howl } from 'howler'

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

    const stopPromise = new Promise((resolve, reject) =>
      this.mediaRecorder.addEventListener('stop', resolve))

    this.mediaRecorder.stop()
    await stopPromise
  }

  async load () {
    const blobUrl = URL.createObjectURL(new Blob(this.chunks, { type: this.mimeType }))
    const sound = new Howl({ src: [blobUrl], format: ['webm'] })

    await new Promise((resolve, reject) => sound.once('load', resolve))
    return sound
  }

  _onDataAvailable (event) {
    this.chunks.push(event.data)
  }
}
