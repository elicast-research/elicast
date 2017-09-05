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
const THUMB_WIDTH = 4
const THUMB_HEIGHT = 10
const DISABLED_ALPHA = 0.5
const DEFAULT_COLOR = 'black'

export default {
  props: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: DEFAULT_COLOR
    },
    overlays: {
      type: Array,
      default: []
    }
  },

  data () {
    return {
      width: 0, // resized
      height: 10,

      val: 0
    }
  },

  computed: {
    slideWidth () {
      return this.width - WIDTH_PADDING
    },
    slideLeft () {
      return WIDTH_PADDING / 2
    },
    slideRight () {
      return this.width - WIDTH_PADDING / 2
    }
  },

  watch: {
    min (min) {
      if (this.val < min) {
        this.val = min
      } else {
        this.$emit('change', this.val, false)
        this.draw()
      }
    },
    max (max) {
      if (this.val > max) {
        this.val = max
      } else {
        this.$emit('change', this.val, false)
        this.draw()
      }
    },
    val (val, prevVal) {
      this.$emit('change', val, this.isMouseDown)
      this.draw()
    },
    width () { this.drawDebounce() },
    height () { this.drawDebounce() },
    disabled () { this.draw() }
  },

  mounted () {
    window.addEventListener('resize', this.handleWindowResize)

    window.el = this.$refs.canvas

    this.width = this.$el.clientWidth
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.handleWindowResize)
  },

  methods: {
    handleWindowResize (e) {
      this.layout()
    },

    handleMousedown (e) {
      if (this.disabled) return false

      if (e.which === 1 || e.buttons === 1) {
        e.preventDefault()

        this.isMouseDown = true

        this.slide(e.offsetX)

        document.addEventListener('mousemove', this.handleDocumentMousemove)
        document.addEventListener('mouseup', this.handleDocumentMouseup)
      }
      return false
    },

    handleDocumentMousemove (e) {
      if (this.isMouseDown) {
        e.preventDefault()

        let offsetX = e.pageX - this.$el.offsetLeft
        this.slide(offsetX)
      }

      return false
    },

    handleDocumentMouseup (e) {
      if (this.isMouseDown) {
        this.isMouseDown = false

        document.removeEventListener('mousemove', this.handleDocumentMousemove)
        document.removeEventListener('mouseup', this.handleDocumentMouseup)
      }

      return false
    },

    layout () {
      this.width = this.$el.offsetWidth
    },

    slide (offset) {
      if (this.disabled) return false

      this.val = this.offsetToVal(offset)
    },

    offsetToVal (offset) {
      offset = Math.max(this.slideLeft, Math.min(offset, this.slideRight))
      offset -= this.slideLeft
      return Math.round(this.min + offset / this.slideWidth * (this.max - this.min))
    },

    valToOffset (val) {
      val = (val - this.min) / (this.max - this.min)
      return val * this.slideWidth + this.slideLeft
    },

    drawDebounce: _.debounce(function () { this.draw() }, 100),

    draw () {
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')

      ctx.globalAlpha = this.disabled ? DISABLED_ALPHA : 1

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const color = Color(this.color)
      const slideFromY = canvas.height / 2 - SLIDE_HEIGHT / 2

      // background
      ctx.fillStyle = color.fade(0.8).string()
      ctx.fillRect(this.slideLeft, slideFromY, this.slideWidth, SLIDE_HEIGHT)

      // overlays
      if (this.color === DEFAULT_COLOR) {
        for (const overlay of this.overlays) {
          const fromOffset = this.valToOffset(overlay.from)
          const toOffset = this.valToOffset(overlay.to)

          ctx.fillStyle = Color(overlay.color).fade(0.2).string()
          ctx.fillRect(fromOffset, slideFromY, toOffset - fromOffset, SLIDE_HEIGHT)
        }
      }

      // progress shade
      const offset = this.valToOffset(this.val)
      ctx.fillStyle = color.fade(0.8).string()
      ctx.fillRect(this.slideLeft, slideFromY, offset - this.slideLeft, SLIDE_HEIGHT)

      // thumb
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
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
  }

}
</style>
