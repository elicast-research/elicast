import qs from 'qs'

export default {
  install (Vue, options) {
    const $query = qs.parse(window.location.search.substr(1))

    Object.defineProperty(Vue.prototype, '$query', {
      get () { return $query }
    })
  }
}
