import { Howl } from 'howler'

/**
 *  SoundManager
 */
export default class SoundManager {
  constructor (mimeType, recordedBlobs = null) {
    this.mediaRecorder = null
    this.mimeType = mimeType
    this.chunks = recordedBlobs !== null ? recordedBlobs : []
    this.tempChunks = []
    this.sounds = []
  }

  async record () {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: this.mimeType })
    this.mediaRecorder.ondataavailable = this._onDataAvailable.bind(this)
    this.mediaRecorder.start()
    return this.chunks.length
  }

  async stopRecording () {
    if (!this.mediaRecorder) throw new Error('Not recording')

    const stopPromise = new Promise((resolve, reject) =>
      this.mediaRecorder.addEventListener('stop', resolve))

    this.mediaRecorder.stop()
    await stopPromise

    this.chunks.push(new Blob(this.tempChunks, { type: this.mimeType }))
    this.tempChunks = []
  }

  async preload () {
    // load sounds 'sequentially'
    this.sounds = []
    for (let i = 0; i < this.chunks.length; i++) {
      this.sounds[i] = await SoundManager._loadSound(this.chunks[i])
    }
  }

  async load (chunkIdx) {
    if (this.sounds[chunkIdx]) return this.sounds[chunkIdx]

    const sound = await SoundManager._loadSound(this.chunks[chunkIdx])

    this.sounds[chunkIdx] = sound
    return sound
  }

  _onDataAvailable (event) {
    this.tempChunks.push(event.data)
  }

  static async _loadSound (chunk) {
    const blobUrl = URL.createObjectURL(chunk)
    const sound = new Howl({ src: [blobUrl], format: ['webm'] })

    await new Promise((resolve, reject) => sound.once('load', resolve))
    return sound
  }
}
