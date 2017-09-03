<template>
  <div>
    <div :class="toast.class"
         v-for="toast in toasts"
         v-html="toast.content"
         role="alert">
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      toasts: []
    }
  },

  methods: {
    show (toast) {
      this.toasts.push(toast)
      if (toast.lifespan) {
        setTimeout(() => this.remove(toast), toast.lifespan)
      }
      return toast
    },
    remove (toast) {
      const idx = this.toasts.indexOf(toast)
      this.toasts.splice(idx, 1)
    }
  }
}
</script>

<style lang="scss">
</style>
