<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  computed: {
    resizeHandleEl () {
      return this.$el.querySelector('.resize-handle')
    }
  },

  mounted () {
    console.log(typeof this.$el.querySelector('.resize-handle'))
    this.$el.querySelectorAll('.resize-handle')
      .forEach(e => e.addEventListener('mousedown', this.handleMousedown))
  },

  methods: {
    handleMousedown (e) {
      if (e.which === 1 || e.buttons === 1) {
        e.preventDefault()

        this.isMouseDown = true

        const elRect = this.$el.getBoundingClientRect()
        this.isHandleTop = e.screenY < (elRect.top + elRect.bottom) / 2
        this.isHandleLeft = e.screenX < (elRect.left + elRect.right) / 2

        this.startScreenX = e.screenX
        this.startScreenY = e.screenY
        this.startElementWidth = this.$el.offsetWidth
        this.startElementHeight = this.$el.offsetHeight

        document.addEventListener('mousemove', this.handleDocumentMousemove)
        document.addEventListener('mouseup', this.handleDocumentMouseup)
      }
      return false
    },

    handleDocumentMousemove (e) {
      if (this.isMouseDown) {
        e.preventDefault()

        let offsetX = (e.screenX - this.startScreenX) * (this.isHandleLeft ? -1 : 1)
        let offsetY = (e.screenY - this.startScreenY) * (this.isHandleTop ? -1 : 1)

        this.$el.style.width = (this.startElementWidth + offsetX) + 'px'
        this.$el.style.height = (this.startElementHeight + offsetY) + 'px'
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
    }
  }
}
</script>

<style lang="scss">
</style>
