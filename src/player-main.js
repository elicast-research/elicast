import Vue from 'vue'
import ElicastPlayerMain from './PlayerMain'
import QueryPlugin from './plugin/query'
import './assets/main.scss'

Vue.use(QueryPlugin)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#player_main',
  template: '<ElicastPlayerMain/>',
  components: { ElicastPlayerMain }
})
