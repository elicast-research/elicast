<template>
  <transition-group name="list" tag="div">
    <div :class="toast.class"
         v-for="toast in toasts"
         v-html="toast.content"
         :key="toast._id"
         role="alert">
    </div>
  </transition-group>
</template>

<script>

let toastIdCounter = 1

export default {
  data () {
    return {
      toasts: []
    }
  },

  methods: {
    show (toast) {
      toast._id = toastIdCounter++
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

<style lang="scss" scoped>

.list-enter-active, .list-leave-active {
  transition: opacity .2s
}
.list-enter, .list-leave-to {
  opacity: 0
}

</style>
