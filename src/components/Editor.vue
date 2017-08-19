<template>
  <div id="editor">
    <!-- <img src="../assets/logo.png"> -->
    <codemirror v-model="code"
                :options="editorOptions"
                @beforeChange="onEditorBeforeChange"
                @cursorActivity="onEditorCursorActivity">
    </codemirror>
    <Slider />
  </div>
</template>

<script>
import ElicastOT from '@/elicast_ot'
import { codemirror, CodeMirror } from 'vue-codemirror'
import 'codemirror/addon/selection/mark-selection'
import Slider from '@/components/slider'


export default {
  data () {
    return {
      code: 'const a = 10',
      editorOptions: {
        // mode: 'python'
        lineNumbers: true,
        cursorBlinkRate: 0, // disable default blinker which is not working in no-focus state
        autofocus: true
      }
    }
  },
  methods: {
    onEditorBeforeChange(cm, changeObj) {
      console.log('OT', ElicastOT.makeOTFromCMChange(cm, changeObj));
    },
    onEditorCursorActivity(cm) {
      console.log('OT', ElicastOT.makeOTFromCMSelection(cm));
    }
  },
  components: {
    codemirror,
    Slider
  }
}
</script>

<style lang="scss">

#editor {

}

</style>
