import Vue from 'vue'
import ElicastEditorMain from './EditorMain'
import QueryPlugin from './plugin/query'
import LoggerPlugin from './plugin/logger'
import './assets/main.scss'

Vue.use(QueryPlugin)
Vue.use(LoggerPlugin)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#editor_main',
  template: '<ElicastEditorMain/>',
  components: { ElicastEditorMain }
})
