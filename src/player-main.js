import Vue from 'vue'
import ElicastPlayerMain from './PlayerMain'
import './assets/main.scss'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#player_main',
  template: '<ElicastPlayerMain/>',
  components: { ElicastPlayerMain }
})
