import Vue from 'vue'
import ElicastEditorMain from './EditorMain'
import './assets/main.scss'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#editor_main',
  template: '<ElicastEditorMain/>',
  components: { ElicastEditorMain }
})
