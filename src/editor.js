// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import ElicastEditor from '@/components/Editor'
import ElicastOT from './elicast_ot';

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#editor',
  template: '<ElicastEditor/>',
  components: { ElicastEditor }
})
