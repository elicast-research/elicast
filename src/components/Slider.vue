<template>
  <div class="slider" :disabled="disabled">
    <canvas ref="canvas"
            :width="width"
            :height="height"
            @mousedown="handleMousedown">
    </canvas>
  </div>
</template>

<script>
import _ from 'lodash'
import Color from 'color'

const WIDTH_PADDING = 10
const SLIDE_HEIGHT = 4
const THUMB_WIDTH = 4, THUMB_HEIGHT = 10
const DISABLED_ALPHA = 0.5

let isMouseDown = false

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: 'black'
    }
  },

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

  watch: {
    min(min) {
      if (this.val < min) {
        this.val = min
      } else {
        this.$emit('change', this.val, false)
        this.draw()
      }
    },
    max(max) {
      if (this.val > max) {
        this.val = max
      } else {
        this.$emit('change', this.val, false)
        this.draw()
      }
    },
    val(val, prevVal) {
      this.$emit('change', val, isMouseDown)
      this.draw()
    },
    width() { this.drawDebounce() },
    height() { this.drawDebounce() },
    disabled() { this.draw() }
  },

  mounted() {
    window.addEventListener('resize', this.handleWindowResize)

    window.el = this.$refs.canvas

    this.width = this.$el.clientWidth
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleWindowResize)
  },

  methods: {
    handleWindowResize(e) {
      this.layout()
    },

    handleMousedown(e) {
      if (e.which === 1 || e.buttons === 1) {
        e.preventDefault()

        isMouseDown = true

        this.slide(e.offsetX)

        document.addEventListener('mousemove', this.handleDocumentMousemove)
        document.addEventListener('mouseup', this.handleDocumentMouseup)

        this.$el.focus()
      }
      return false
    },

    handleDocumentMousemove(e) {
      if (isMouseDown) {
        e.preventDefault()

        let offsetX = e.pageX - this.$el.offsetLeft
        this.slide(offsetX)
      }

      return false
    },

    handleDocumentMouseup(e) {
      isMouseDown = false

      document.removeEventListener('mousemove', this.handleDocumentMousemove)
      document.removeEventListener('mouseup', this.handleDocumentMouseup)

      this.$el.focus()

      return false
    },

    layout() {
      this.width = this.$el.offsetWidth
    },

    slide(offset) {
      if (this.disabled) return false

      this.val = this.offsetToVal(offset)
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

    drawDebounce: _.debounce(function() { this.draw() }, 100),

    draw() {
      let canvas = this.$refs.canvas
      let ctx = canvas.getContext('2d')

      ctx.globalAlpha = this.disabled ? DISABLED_ALPHA : 1

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let color = Color(this.color)
      ctx.fillStyle = color.fade(0.8).string()
      ctx.fillRect(this.slideLeft, canvas.height / 2 - SLIDE_HEIGHT / 2, this.slideWidth, SLIDE_HEIGHT)

      ctx.fillStyle = color.fade(0.8).string()
      ctx.fillRect(this.slideLeft, canvas.height / 2 - SLIDE_HEIGHT / 2, this.valToOffset(this.val) - this.slideLeft, SLIDE_HEIGHT)

      let offset = this.valToOffset(this.val)

      ctx.fillStyle = color.string()
      ctx.fillRect(offset - THUMB_WIDTH / 2, 0, THUMB_WIDTH, THUMB_HEIGHT)
    }
  }
}
</script>

<style lang="scss" scoped>
.slider[disabled] canvas {
  cursor: default;
}
.slider {
  overflow: hidden; // for resize

  canvas {
    cursor: pointer;
  }

}
</style>
