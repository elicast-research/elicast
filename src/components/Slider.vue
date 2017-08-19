<template>
  <div class="slider">
    <canvas ref="canvas"
            :width="width"
            :height="height"
            @mousedown="handleMousedown">
    </canvas>
  </div>
</template>

<script>
import _ from 'lodash'

const WIDTH_PADDING = 20
const SLIDE_HEIGHT = 4
const THUMB_WIDTH = 4, THUMB_HEIGHT = 10

let isMouseDown = false

export default {
  data() {
    return {
      width: 0, // resized
      height: 10,

      min: 0,
      max: 0,
      val: 0
    }
  },

  computed: {
    slideWidth() {
      return this.width - WIDTH_PADDING
    },
    slideLeft() {
      return WIDTH_PADDING / 2
    },
    slideRight() {
      return this.width - WIDTH_PADDING / 2
    }
  },

  mounted() {
    window.addEventListener('resize', this.handleResize)

    this.width = this.$el.clientWidth
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },

  watch: {
    width() { this.redrawDebounce() },
    height() { this.redrawDebounce() }
  },

  methods: {
    handleWindowResize(e) {
      this.width = this.$el.clientWidth
    },

    handleMousedown(e) {
      if (e.which === 1 || e.buttons === 1) {
        e.preventDefault()

        isMouseDown = true

        this.slide(e.offsetX)

        document.addEventListener('mousemove', this.handleDocumentMousemove)
        document.addEventListener('mouseup', this.handleDocumentMouseup)

        this.$refs.canvas.focus()
      }
      return false
    },

    handleDocumentMousemove(e) {
      if (isMouseDown) {
        e.preventDefault()

        let offsetX = e.pageX - this.$refs.canvas.offsetLeft
        this.slide(offsetX)
      }

      return false
    },

    handleDocumentMouseup(e) {
      isMouseDown = false

      document.removeEventListener('mousemove', this.handleDocumentMousemove)
      document.removeEventListener('mouseup', this.handleDocumentMouseup)

      this.$refs.canvas.focus()

      return false
    },

    slide(offset) {
      let val = this.offsetToVal(offset)
      if (this.val !== val) {
        this.$emit('change', val)
        this.val = val

        this.redraw()
      }
    },

    offsetToVal(offset) {
      offset = Math.max(this.slideLeft, Math.min(offset, this.slideRight))
      offset -= this.slideLeft
      return Math.round(this.min + offset / this.slideWidth * (this.max - this.min))
    },

    valToOffset(val) {
      val = (val - this.min) / (this.max - this.min)
      return val * this.slideWidth + this.slideLeft
    },

    redrawDebounce: _.debounce(function() { this.redraw() }, 100),

    redraw() {
      console.log('redraw', this.width, this.height)

      let canvas = this.$refs.canvas
      let ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(this.slideLeft, canvas.height / 2 - SLIDE_HEIGHT / 2, this.slideWidth, SLIDE_HEIGHT)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(this.slideLeft, canvas.height / 2 - SLIDE_HEIGHT / 2, this.valToOffset(this.val) - this.slideLeft, SLIDE_HEIGHT)

      let offset = this.valToOffset(this.val)

      ctx.fillStyle = 'rgba(0, 0, 0, 1)'
      ctx.fillRect(offset - THUMB_WIDTH / 2, 0, THUMB_WIDTH, THUMB_HEIGHT)
    }
  }
}
</script>

<style lang="scss" scoped>
canvas {
  cursor: pointer;
}
</style>
