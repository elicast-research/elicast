// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import ElicastEditorMain from './EditorMain'
import ElicastEditor from '@/components/Editor'
import ElicastOT from './elicast_ot';
import './assets/main.scss';

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#editor_main',
  template: '<ElicastEditorMain/>',
  components: { ElicastEditorMain }
})
