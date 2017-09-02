<template>
  <div id="editor">
    <div>
      <input class="elicast-title" v-model.trim="elicastTitle">
    </div>
    <div class="code-wrap">
      <codemirror ref="cm"
                  v-model="code"
                  :class="{ 'recording-exercise': recordExerciseInitiated,
                    'recording-assert': recordAssertInitiated }"
                  :options="editorOptions"
                  @beforeChange="handleEditorBeforeChange"
                  @change="handleEditorChange"
                  @cursorActivity="handleEditorCursorActivity">
      </codemirror>

      <div class="code-right-pane">
        <div class="pause-controls code-right-pane-controls"
             v-show="playMode === PlayMode.PAUSE">
          <button class="btn btn-sm btn-light"
                  @click="cutOts">
            <i class="fa fa-scissors"></i> Cut Here
          </button>
        </div>
        <div class="standby-controls code-right-pane-controls"
             v-show="playMode === PlayMode.STANDBY || playMode === PlayMode.STANDBY_ASSERT">
          <button class="btn btn-sm btn-light"
                  @click="toggleRecordAssert">
            <i class="fa fa-pencil-square-o"></i> Record Assert
          </button>
        </div>
        <div class="assert-controls code-right-pane-controls"
             v-show="playMode === PlayMode.ASSERT">
         <button class="btn btn-sm btn-light"
                :disabled="!playModeReady"
                @click="runCode">
           <i class="fa fa-terminal"></i> Run
         </button>
          <button class="btn btn-sm btn-light"
                  @click="toggleRecordAssert">
            <i class="fa fa-pencil-square-o"></i> End Assert Recording
          </button>
        </div>
        <div v-show="playMode === PlayMode.RECORD || playMode === PlayMode.RECORD_EXERCISE"
             class="record-controls code-right-pane-controls">
          <button class="btn btn-sm btn-light"
                 :disabled="!playModeReady"
                 @click="runCode">
            <i class="fa fa-terminal"></i> Run
          </button>
          <button class="btn btn-sm btn-light"
                  @click="toggleRecordExercise"
                  :disabled="!playModeReady">
            <span v-show="playMode === PlayMode.RECORD">
              <i class="fa fa-pencil-square-o"></i> Record Exercise
            </span>
            <span v-show="playMode === PlayMode.RECORD_EXERCISE">
              <i class="fa fa-pencil-square-o"></i> End Exercise Recording
            </span>
          </button>
        </div>

        <RunOutputView :output="runOutput"></RunOutputView>
      </div>
    </div>

    <div class="controls">
      <button ref="controlButton"
              class="btn btn-sm btn-light"
              @click="togglePlayMode"
              :disabled="playMode === PlayMode.RECORD_EXERCISE ||
                playMode === PlayMode.ASSERT ||
                playMode === PlayMode.STANDBY_ASSERT ||
                !playModeReady">
        <i v-show="playMode === PlayMode.PAUSE" class="fa fa-play"></i>
        <i v-show="playMode === PlayMode.PLAYBACK" class="fa fa-pause"></i>
        <i v-show="playMode === PlayMode.STANDBY" class="fa fa-video-camera"></i>
        <i v-show="playMode.isRecording()" class="fa fa-video-camera text-danger"></i>
      </button>

      <Slider ref="slider"
              class="slider"
              @change="handleSliderChange"
              :color="sliderColor"
              :max="maxTs"
              :disabled="playMode.isRecording()"></Slider>

      <div class="ts-display text-secondary">
        {{ tsDisplay }}
      </div>
    </div>
  </div>
</template>

<script src="./Editor.js"></script>

<style lang="scss">

.elicast-title {
  max-width: 100%;
  margin: 0;
  padding: 0;
  outline: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: none;
  border: none;
  box-shadow: none;
  display: inline-block;
  font-size: 2rem;
  width: 100%;
}

.record-controls button {
  background-color: transparentize(red, .925);
  border-color: transparent;

  &:hover {
    background-color: transparentize(red, 0.85);
    border-color: transparentize(red, 0.85);
  }
}

.CodeMirror {
  $readonlyBackgroundColor: rgba(0, 0, 0, 0.066);

  .recording-exercise ~ & {
    background-color: $readonlyBackgroundColor;
  }

  .recording-assert ~ & {
    background-color: $readonlyBackgroundColor;
  }

  .recording-exercise-block {
    padding: .2em 0;
    border-radius: .2em;
    background-color: white;
  }
  .recording-assert-block {
     padding: .2em 0;
     border-radius: .2em;
     background-color: white;
   }
}
</style>
