import Vue from 'vue'
import ElicastPlayerMain from './PlayerMain'
import QueryPlugin from './plugin/query'
import LoggerPlugin from './plugin/logger'
import './assets/main.scss'

Vue.use(QueryPlugin)
Vue.use(LoggerPlugin)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#player_main',
  template: '<ElicastPlayerMain/>',
  components: { ElicastPlayerMain }
})
