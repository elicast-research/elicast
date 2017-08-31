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
    this.$el.querySelectorAll('.resize-handle')
      .forEach(e => e.addEventListener('mousedown', this.handleMousedown))
  },

  methods: {
    handleMousedown (e) {
      if (e.which === 1 || e.buttons === 1) {
        e.preventDefault()

        this.isMouseDown = true

        const elRect = this.$el.getBoundingClientRect()
        this.isHandleTop = e.clientY < (elRect.top + elRect.bottom) / 2
        this.isHandleLeft = e.clientX < (elRect.left + elRect.right) / 2

        this.startClientX = e.clientX
        this.startClientY = e.clientY
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

        let offsetX = (e.clientX - this.startClientX) * (this.isHandleLeft ? -1 : 1)
        let offsetY = (e.clientY - this.startClientY) * (this.isHandleTop ? -1 : 1)

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
